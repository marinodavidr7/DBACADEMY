import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { usePlatform } from '../context/PlatformContext';

type FormulaMode = 'SI' | 'CONTAR.SI' | 'SUMAR.SI';
type ComparisonOp = '>' | '<' | '>=' | '<=' | '=' | '<>';

interface FormulaConfig {
  mode: FormulaMode;
  operator: ComparisonOp;
  threshold: number;
  trueLabel: string;
  falseLabel: string;
}

interface SimLogEntry {
  id: string;
  kind: 'true' | 'false' | 'info';
  badge: string;
  text: string;
}

interface CrateEntity {
  id: number;
  value: number;
  group: THREE.Group;
  numberTexture: THREE.CanvasTexture;
  phase: 'intake' | 'scanning' | 'branching' | 'exiting';
  branch: 'true' | 'false' | null;
  progress: number;
  scanTimer: number;
  evaluated: boolean;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);
  } catch {
    return false;
  }
}

function afterDraw(renderer: THREE.WebGLRenderer, callback: () => void) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (typeof gl.fenceSync === 'function') {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (sync) {
      const check = () => {
        const res = gl.clientWaitSync(sync, 0, 0);
        if (res === gl.ALREADY_SIGNALED || res === gl.CONDITION_SATISFIED) {
          gl.deleteSync(sync);
          window.setTimeout(callback, 80);
        } else if (res === gl.WAIT_FAILED) {
          gl.deleteSync(sync);
          window.setTimeout(callback, 80);
        } else {
          window.setTimeout(check, 16);
        }
      };
      gl.flush();
      window.setTimeout(check, 16);
      return;
    }
  }
  window.setTimeout(callback, 80);
}

function evaluateCondition(value: number, op: ComparisonOp, threshold: number): boolean {
  switch (op) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '=':
      return value === threshold;
    case '<>':
      return value !== threshold;
  }
}

function createBeltTexture(baseHex: string, stripeHex: string, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = stripeHex;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (let y = -64; y < 320; y += 64) {
    ctx.beginPath();
    ctx.moveTo(36, y + 32);
    ctx.lineTo(128, y);
    ctx.lineTo(220, y + 32);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  tex.anisotropy = maxAniso;
  return tex;
}

function createCrateNumberTexture(value: number, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#fbbf24');
  grad.addColorStop(1, '#d97706');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle recessed crate border
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 240, 240);

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 212, 212);

  // Crisp centered number with subtle shadow
  const text = String(value);
  ctx.font = '800 108px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
  ctx.fillText(text, 132, 136);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, 128, 130);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function createFloatingLabelSprite(text: string, colorHex: string, maxAniso: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 140);

  ctx.font = '900 70px ui-sans-serif, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.strokeText(text, 256, 72);
  ctx.fillStyle = colorHex;
  ctx.fillText(text, 256, 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.8, 1.05, 1);
  return sprite;
}

interface ExcelSimulator3DProps {
  compact?: boolean;
  initialMode?: FormulaMode;
  externalMode?: FormulaMode;
  onInteract?: () => void;
}

export const ExcelSimulator3D: React.FC<ExcelSimulator3DProps> = ({
  compact = false,
  initialMode = 'SI',
  externalMode,
  onInteract,
}) => {
  const { theme, t } = usePlatform();

  // Draft formula controls (applied on "APLICAR")
  const [draftMode, setDraftMode] = useState<FormulaMode>(externalMode ?? initialMode);
  const [draftOperator, setDraftOperator] = useState<ComparisonOp>('>');
  const [draftThreshold, setDraftThreshold] = useState<number>(50);
  const [draftTrueLabel, setDraftTrueLabel] = useState<string>('Verdadero');
  const [draftFalseLabel, setDraftFalseLabel] = useState<string>('Falso');

  // Active formula used by the 3D scanner
  const [activeFormula, setActiveFormula] = useState<FormulaConfig>({
    mode: externalMode ?? initialMode,
    operator: '>',
    threshold: 50,
    trueLabel: 'Verdadero',
    falseLabel: 'Falso',
  });
  const activeFormulaRef = useRef<FormulaConfig>(activeFormula);
  activeFormulaRef.current = activeFormula;

  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [customCrateValue, setCustomCrateValue] = useState<string>('75');
  const [trueCount, setTrueCount] = useState(0);
  const [falseCount, setFalseCount] = useState(0);
  const [trueSum, setTrueSum] = useState(0);
  const [logs, setLogs] = useState<SimLogEntry[]>([
    {
      id: 'init-0',
      kind: 'info',
      badge: 'INFO',
      text: 'Sistema iniciado.',
    },
  ]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const spawnQueueRef = useRef<number[]>([57, 98, 43, 7]);
  const resetCameraFnRef = useRef<(() => void) | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const appendLog = useCallback((entry: Omit<SimLogEntry, 'id'>) => {
    setLogs((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      ...prev.slice(0, 29),
    ]);
  }, []);

  // Sync formula mode when student switches Excel sub-modules
  useEffect(() => {
    if (!externalMode) return;
    setDraftMode(externalMode);
    setActiveFormula((prev) => {
      if (prev.mode === externalMode) return prev;
      return { ...prev, mode: externalMode };
    });
  }, [externalMode]);

  const handleApplyFormula = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onInteract?.();
    const sanitizedThreshold = Number.isFinite(draftThreshold) ? draftThreshold : 0;
    const nextConfig: FormulaConfig = {
      mode: draftMode,
      operator: draftOperator,
      threshold: sanitizedThreshold,
      trueLabel: draftTrueLabel.trim() || 'Verdadero',
      falseLabel: draftFalseLabel.trim() || 'Falso',
    };
    setActiveFormula(nextConfig);
    setTrueCount(0);
    setFalseCount(0);
    setTrueSum(0);

    const formulaPreview =
      nextConfig.mode === 'SI'
        ? `=SI([Caja] ${nextConfig.operator} ${nextConfig.threshold} ; "${nextConfig.trueLabel}" ; "${nextConfig.falseLabel}")`
        : nextConfig.mode === 'CONTAR.SI'
          ? `=CONTAR.SI(Cajas; "${nextConfig.operator}${nextConfig.threshold}")`
          : `=SUMAR.SI(Cajas; "${nextConfig.operator}${nextConfig.threshold}")`;

    appendLog({
      kind: 'info',
      badge: 'INFO',
      text: `Fórmula aplicada: ${formulaPreview}`,
    });
  };

  const handleSpawnCrate = (explicitValue?: number) => {
    onInteract?.();
    const val =
      typeof explicitValue === 'number' && Number.isFinite(explicitValue)
        ? Math.round(explicitValue)
        : Math.floor(Math.random() * 99) + 1;
    spawnQueueRef.current.push(val);
  };

  const formulaTitle = useMemo(() => {
    if (draftMode === 'CONTAR.SI') return '=CONTAR.SI()';
    if (draftMode === 'SUMAR.SI') return '=SUMAR.SI()';
    return '=SI()';
  }, [draftMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const scene = new THREE.Scene();

    const getBgColor = () => (themeRef.current === 'dark' ? 0x0b111e : 0xdce4ee);
    scene.background = new THREE.Color(getBgColor());
    scene.fog = new THREE.FogExp2(getBgColor(), 0.022);

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const defaultCameraPos = new THREE.Vector3(0.4, 7.6, 12.6);
    const defaultTarget = new THREE.Vector3(0, 0.85, -0.4);
    camera.position.copy(defaultCameraPos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Environment & Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.7;
    roomEnv.dispose();

    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x64748b, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(7, 13, 9);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 36;
      keyLight.shadow.camera.left = -12;
      keyLight.shadow.camera.right = 12;
      keyLight.shadow.camera.top = 12;
      keyLight.shadow.camera.bottom = -12;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    rimLight.position.set(-8, 6, -10);
    scene.add(rimLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 6;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minPolarAngle = 0.25;
    controls.update();

    resetCameraFnRef.current = () => {
      camera.position.copy(defaultCameraPos);
      controls.target.copy(defaultTarget);
      controls.update();
    };

    // Disposable resource tracking
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometriesToDispose.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materialsToDispose.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(tex: T): T => {
      texturesToDispose.push(tex);
      return tex;
    };

    // Studio floor shadow plane
    const floorGeo = trackGeo(new THREE.PlaneGeometry(60, 60));
    const floorMat = trackMat(
      new THREE.ShadowMaterial({
        opacity: 0.14,
      })
    );
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Materials
    const metalMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.42,
        metalness: 0.55,
      })
    );
    const railMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.35,
        metalness: 0.65,
      })
    );
    const archBlueMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.28,
        metalness: 0.25,
      })
    );
    const crateTrimMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.45,
        metalness: 0.2,
      })
    );

    const intakeBeltTex = trackTex(createBeltTexture('#70849c', '#54667d', maxAniso));
    const falseBeltTex = trackTex(createBeltTexture('#ef4444', '#dc2626', maxAniso));
    const trueBeltTex = trackTex(createBeltTexture('#22c55e', '#16a34a', maxAniso));

    const intakeBeltMat = trackMat(
      new THREE.MeshStandardMaterial({ map: intakeBeltTex, roughness: 0.55, metalness: 0.08 })
    );
    const falseBeltMat = trackMat(
      new THREE.MeshStandardMaterial({ map: falseBeltTex, roughness: 0.5, metalness: 0.08 })
    );
    const trueBeltMat = trackMat(
      new THREE.MeshStandardMaterial({ map: trueBeltTex, roughness: 0.5, metalness: 0.08 })
    );

    // 1. Intake conveyor (-Z to junction)
    const intakeGroup = new THREE.Group();
    const intakeDeckGeo = trackGeo(new THREE.BoxGeometry(2.35, 0.26, 7.6));
    const intakeDeck = new THREE.Mesh(intakeDeckGeo, intakeBeltMat);
    intakeDeck.position.set(0, 0.18, -4.6);
    intakeDeck.receiveShadow = true;
    intakeDeck.castShadow = true;
    intakeGroup.add(intakeDeck);

    const railSideGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.36, 7.7));
    const leftRail = new THREE.Mesh(railSideGeo, railMat);
    leftRail.position.set(-1.24, 0.22, -4.6);
    leftRail.castShadow = true;
    const rightRail = new THREE.Mesh(railSideGeo, railMat);
    rightRail.position.set(1.24, 0.22, -4.6);
    rightRail.castShadow = true;
    intakeGroup.add(leftRail, rightRail);

    // Rollers along intake
    const rollerGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 2.25, 12));
    for (let z = -8.0; z <= -1.2; z += 1.1) {
      const roller = new THREE.Mesh(rollerGeo, metalMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 0.09, z);
      intakeGroup.add(roller);
    }
    scene.add(intakeGroup);

    // 2. Central sorting junction platform
    const junctionGroup = new THREE.Group();
    const junctionGeo = trackGeo(new THREE.BoxGeometry(2.9, 0.42, 3.0));
    const junctionMesh = new THREE.Mesh(junctionGeo, metalMat);
    junctionMesh.position.set(0, 0.21, 0);
    junctionMesh.receiveShadow = true;
    junctionMesh.castShadow = true;
    junctionGroup.add(junctionMesh);

    // Diverter arm on top of junction
    const diverterPivot = new THREE.Group();
    diverterPivot.position.set(0, 0.44, 1.15);
    const diverterArmGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.28, 1.55));
    const diverterArmMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    const diverterArm = new THREE.Mesh(diverterArmGeo, diverterArmMat);
    diverterArm.position.set(0, 0.14, -0.75);
    diverterArm.castShadow = true;
    diverterPivot.add(diverterArm);
    junctionGroup.add(diverterPivot);
    scene.add(junctionGroup);

    // 3. Left Branch (FALSO -> -X) & Right Branch (VERDADERO -> +X)
    const branchLength = 8.4;
    const branchGeo = trackGeo(new THREE.BoxGeometry(branchLength, 0.28, 2.3));
    const branchRailGeo = trackGeo(new THREE.BoxGeometry(branchLength, 0.36, 0.14));

    const falseBranchMesh = new THREE.Mesh(branchGeo, falseBeltMat);
    falseBranchMesh.position.set(-1.45 - branchLength / 2, 0.18, 0);
    falseBranchMesh.receiveShadow = true;
    falseBranchMesh.castShadow = true;
    scene.add(falseBranchMesh);

    const falseFrontRail = new THREE.Mesh(branchRailGeo, railMat);
    falseFrontRail.position.set(-1.45 - branchLength / 2, 0.22, 1.22);
    const falseBackRail = new THREE.Mesh(branchRailGeo, railMat);
    falseBackRail.position.set(-1.45 - branchLength / 2, 0.22, -1.22);
    scene.add(falseFrontRail, falseBackRail);

    const trueBranchMesh = new THREE.Mesh(branchGeo, trueBeltMat);
    trueBranchMesh.position.set(1.45 + branchLength / 2, 0.18, 0);
    trueBranchMesh.receiveShadow = true;
    trueBranchMesh.castShadow = true;
    scene.add(trueBranchMesh);

    const trueFrontRail = new THREE.Mesh(branchRailGeo, railMat);
    trueFrontRail.position.set(1.45 + branchLength / 2, 0.22, 1.22);
    const trueBackRail = new THREE.Mesh(branchRailGeo, railMat);
    trueBackRail.position.set(1.45 + branchLength / 2, 0.22, -1.22);
    scene.add(trueFrontRail, trueBackRail);

    // Floating 3D Labels matching screenshot
    const falseSprite = createFloatingLabelSprite('FALSO', '#ef4444', maxAniso);
    falseSprite.position.set(-4.6, 3.1, -0.4);
    if (falseSprite.material.map) trackTex(falseSprite.material.map);
    trackMat(falseSprite.material);
    scene.add(falseSprite);

    const trueSprite = createFloatingLabelSprite('VERDADERO', '#22c55e', maxAniso);
    trueSprite.position.set(4.6, 3.1, -0.4);
    if (trueSprite.material.map) trackTex(trueSprite.material.map);
    trackMat(trueSprite.material);
    scene.add(trueSprite);

    // 4. Optical Scanner Arch (multi-part composite)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -0.85);

    const pillarGeo = trackGeo(new THREE.BoxGeometry(0.32, 2.55, 0.36));
    const pillarFootGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.16, 0.52));
    const leftPillar = new THREE.Mesh(pillarGeo, archBlueMat);
    leftPillar.position.set(-1.38, 1.48, 0);
    leftPillar.castShadow = true;
    const rightPillar = new THREE.Mesh(pillarGeo, archBlueMat);
    rightPillar.position.set(1.38, 1.48, 0);
    rightPillar.castShadow = true;

    const leftFoot = new THREE.Mesh(pillarFootGeo, metalMat);
    leftFoot.position.set(-1.38, 0.28, 0);
    const rightFoot = new THREE.Mesh(pillarFootGeo, metalMat);
    rightFoot.position.set(1.38, 0.28, 0);

    const crossBarGeo = trackGeo(new THREE.BoxGeometry(3.16, 0.34, 0.44));
    const crossBar = new THREE.Mesh(crossBarGeo, archBlueMat);
    crossBar.position.set(0, 2.75, 0);
    crossBar.castShadow = true;

    const sensorPodGeo = trackGeo(new THREE.BoxGeometry(1.75, 0.18, 0.32));
    const sensorPod = new THREE.Mesh(sensorPodGeo, metalMat);
    sensorPod.position.set(0, 2.52, 0);

    // Status LED indicators on arch top
    const ledGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.12, 0.48));
    const ledMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      })
    );
    const ledBar = new THREE.Mesh(ledGeo, ledMat);
    ledBar.position.set(0, 2.94, 0);

    // Laser scan curtain inside arch
    const laserGeo = trackGeo(new THREE.PlaneGeometry(2.3, 2.0));
    const laserMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const laserCurtain = new THREE.Mesh(laserGeo, laserMat);
    laserCurtain.position.set(0, 1.45, 0);

    archGroup.add(
      leftPillar,
      rightPillar,
      leftFoot,
      rightFoot,
      crossBar,
      sensorPod,
      ledBar,
      laserCurtain
    );
    scene.add(archGroup);

    // Shared Crate Frame Geometries
    const crateBodyGeo = trackGeo(new THREE.BoxGeometry(1.06, 1.06, 1.06));
    const crateBandGeo = trackGeo(new THREE.BoxGeometry(1.1, 0.12, 1.1));

    let nextCrateId = 1;
    const crates: CrateEntity[] = [];
    let spawnCooldown = 0.25;
    let ledPulseTimer = 0;
    let diverterTargetAngle = 0;

    const createCrate = (val: number): CrateEntity => {
      const tex = createCrateNumberTexture(val, maxAniso);
      const faceMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.38,
        metalness: 0.08,
      });

      const group = new THREE.Group();
      const body = new THREE.Mesh(crateBodyGeo, faceMat);
      body.castShadow = true;
      body.receiveShadow = true;

      const topBand = new THREE.Mesh(crateBandGeo, crateTrimMat);
      topBand.position.y = 0.5;
      const bottomBand = new THREE.Mesh(crateBandGeo, crateTrimMat);
      bottomBand.position.y = -0.5;

      group.add(body, topBand, bottomBand);
      group.position.set(0, 0.84, -8.1);
      scene.add(group);

      return {
        id: nextCrateId++,
        value: val,
        group,
        numberTexture: tex,
        phase: 'intake',
        branch: null,
        progress: 0,
        scanTimer: 0,
        evaluated: false,
      };
    };

    const disposeCrate = (crate: CrateEntity) => {
      scene.remove(crate.group);
      crate.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material !== crateTrimMat && !Array.isArray(mesh.material)) {
            mesh.material.dispose();
          }
        }
      });
      crate.numberTexture.dispose();
    };

    // Spawn first crate immediately for instant motion
    const initialVal = spawnQueueRef.current.shift() ?? 57;
    crates.push(createCrate(initialVal));

    // ResizeObserver for crisp responsive viewport
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width < 10 || rect.height < 10) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    });
    resizeObserver.observe(container);

    let disposed = false;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const rawDt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const dt = isPlayingRef.current ? rawDt * speedRef.current : 0;

      // Sync scene background/fog smoothly when user toggles theme
      const targetBgHex = getBgColor();
      if ((scene.background as THREE.Color).getHex() !== targetBgHex) {
        (scene.background as THREE.Color).setHex(targetBgHex);
        (scene.fog as THREE.FogExp2).color.setHex(targetBgHex);
      }

      if (dt > 0) {
        // Animate belt chevrons
        intakeBeltTex.offset.y -= dt * 1.15;
        falseBeltTex.offset.y -= dt * 1.45;
        trueBeltTex.offset.y += dt * 1.45;

        // Spawn next crate periodically or from manual queue
        spawnCooldown -= dt;
        const canSpawnBySpacing =
          crates.length === 0 ||
          crates.every((c) => c.phase !== 'intake' || c.group.position.z > -4.2);

        if (crates.length < 5 && canSpawnBySpacing && (spawnQueueRef.current.length > 0 || spawnCooldown <= 0)) {
          const nextValue =
            spawnQueueRef.current.length > 0
              ? spawnQueueRef.current.shift()!
              : Math.floor(Math.random() * 99) + 1;
          crates.push(createCrate(nextValue));
          spawnCooldown = 2.05;
        }

        // Update LED recovery
        if (ledPulseTimer > 0) {
          ledPulseTimer = Math.max(0, ledPulseTimer - dt);
          if (ledPulseTimer === 0) {
            ledMat.color.setHex(0x38bdf8);
            ledMat.emissive.setHex(0x0284c7);
            laserMat.color.setHex(0x38bdf8);
            laserMat.opacity = 0.16;
          }
        }

        // Update diverter paddle rotation smoothly
        diverterPivot.rotation.y += (diverterTargetAngle - diverterPivot.rotation.y) * Math.min(1, dt * 10);

        // Update crates
        for (let i = crates.length - 1; i >= 0; i--) {
          const c = crates[i];

          if (c.phase === 'intake') {
            c.group.position.z += dt * 2.9;
            // Subtle belt bounce
            c.group.position.y = 0.84 + Math.sin(now * 0.008 + c.id) * 0.012;
            if (c.group.position.z >= -0.85) {
              c.group.position.z = -0.85;
              c.phase = 'scanning';
              c.scanTimer = 0.24;
            }
          } else if (c.phase === 'scanning') {
            c.scanTimer -= dt;
            if (!c.evaluated) {
              c.evaluated = true;
              const cfg = activeFormulaRef.current;
              const passed = evaluateCondition(c.value, cfg.operator, cfg.threshold);
              c.branch = passed ? 'true' : 'false';
              diverterTargetAngle = passed ? -0.58 : 0.58;

              if (passed) {
                ledMat.color.setHex(0x22c55e);
                ledMat.emissive.setHex(0x16a34a);
                laserMat.color.setHex(0x22c55e);
                laserMat.opacity = 0.45;
                setTrueCount((n) => n + 1);
                setTrueSum((s) => s + c.value);
                const resultText =
                  cfg.mode === 'SI'
                    ? cfg.trueLabel
                    : cfg.mode === 'CONTAR.SI'
                      ? 'Contado (+1)'
                      : `Sumado (+${c.value})`;
                appendLog({
                  kind: 'true',
                  badge: 'VERD.',
                  text: `[${c.value}] -> ${resultText}`,
                });
              } else {
                ledMat.color.setHex(0xef4444);
                ledMat.emissive.setHex(0xdc2626);
                laserMat.color.setHex(0xef4444);
                laserMat.opacity = 0.45;
                setFalseCount((n) => n + 1);
                const resultText =
                  cfg.mode === 'SI'
                    ? cfg.falseLabel
                    : cfg.mode === 'CONTAR.SI'
                      ? 'Omitido'
                      : 'No suma';
                appendLog({
                  kind: 'false',
                  badge: 'FALSO',
                  text: `[${c.value}] -> ${resultText}`,
                });
              }
              ledPulseTimer = 0.65;
            }

            // Advance into junction center
            c.group.position.z = THREE.MathUtils.lerp(c.group.position.z, 0, Math.min(1, dt * 8));
            if (c.scanTimer <= 0) {
              c.group.position.z = 0;
              c.phase = 'branching';
            }
          } else if (c.phase === 'branching') {
            const dir = c.branch === 'true' ? 1 : -1;
            c.group.position.x += dir * dt * 3.35;
            c.group.position.y = 0.86 + Math.sin(now * 0.01 + c.id) * 0.014;
            c.group.rotation.y += (dir * -0.18 - c.group.rotation.y) * Math.min(1, dt * 6);

            if (Math.abs(c.group.position.x) >= 8.6) {
              c.phase = 'exiting';
              c.progress = 0;
            }
          } else if (c.phase === 'exiting') {
            const dir = c.branch === 'true' ? 1 : -1;
            c.progress += dt * 3.2;
            c.group.position.x += dir * dt * 2.1;
            c.group.position.y -= dt * 3.4;
            const s = Math.max(0.01, 1 - c.progress);
            c.group.scale.setScalar(s);
            if (c.progress >= 1) {
              disposeCrate(c);
              crates.splice(i, 1);
            }
          }
        }
      }

      // Gentle float on FALSO / VERDADERO 3D markers
      falseSprite.position.y = 3.1 + Math.sin(now * 0.0022) * 0.08;
      trueSprite.position.y = 3.1 + Math.sin(now * 0.0022 + 1.2) * 0.08;

      controls.update();
      renderer.render(scene, camera);

      if (disposed) return;
      if (isSoftwareGl) {
        afterDraw(renderer, tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(renderer, tick);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      crates.forEach(disposeCrate);
      crates.length = 0;

      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((tx) => tx.dispose());
      envRT.dispose();
      pmrem.dispose();
      controls.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [appendLog]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Main Stage: Header + Formula Bar + 3D WebGL Canvas */}
        <div className="lg:col-span-9 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          {/* Simulator Header + Formula Builder */}
          <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-7 rounded-md bg-[#107C41] text-white font-serif italic font-bold text-sm shadow-xs shrink-0">
                  fx
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Simulador de <span className="text-[#107C41] dark:text-emerald-400">{formulaTitle}</span>
                </h2>
              </div>

              {/* Formula Mode Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                {(['SI', 'CONTAR.SI', 'SUMAR.SI'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDraftMode(m);
                      setActiveFormula((prev) => ({ ...prev, mode: m }));
                      appendLog({
                        kind: 'info',
                        badge: 'INFO',
                        text: `Modo cambiado a =${m}()`,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors whitespace-nowrap ${
                      draftMode === m
                        ? 'bg-[#107C41] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    ={m}()
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Excel Formula Bar */}
            <form
              onSubmit={handleApplyFormula}
              className="flex flex-wrap items-center gap-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 font-mono text-xs sm:text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ={draftMode}(
                </span>

                <span className="rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 text-blue-700 dark:text-blue-300 font-semibold">
                  [Caja]
                </span>

                <select
                  value={draftOperator}
                  onChange={(e) => setDraftOperator(e.target.value as ComparisonOp)}
                  aria-label="Operador lógico"
                  className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[34px]"
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="=">=</option>
                  <option value="<>">&lt;&gt;</option>
                </select>

                <input
                  type="number"
                  value={draftThreshold}
                  onChange={(e) => setDraftThreshold(Number(e.target.value))}
                  aria-label="Valor umbral"
                  className="w-20 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100 font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[34px]"
                />

                {draftMode === 'SI' && (
                  <>
                    <span className="text-slate-500 font-bold">;</span>
                    <input
                      type="text"
                      value={draftTrueLabel}
                      onChange={(e) => setDraftTrueLabel(e.target.value)}
                      maxLength={16}
                      aria-label="Texto si es verdadero"
                      className="w-28 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 text-emerald-700 dark:text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-slate-500 font-bold">;</span>
                    <input
                      type="text"
                      value={draftFalseLabel}
                      onChange={(e) => setDraftFalseLabel(e.target.value)}
                      maxLength={16}
                      aria-label="Texto si es falso"
                      className="w-24 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-2 py-1 text-red-700 dark:text-red-300 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </>
                )}

                <span className="font-bold text-slate-800 dark:text-slate-200">)</span>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-[#107C41] hover:bg-[#0d6535] px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white transition-colors shadow-xs min-h-[42px] whitespace-nowrap"
              >
                APLICAR
              </button>
            </form>

            {/* Compact Transport & Crate Spawner Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[36px]"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? t('simPause') : t('simPlay')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSpawnCrate()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('simRandomCrate')}</span>
                </button>

                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden min-h-[36px]">
                  <input
                    type="number"
                    value={customCrateValue}
                    onChange={(e) => setCustomCrateValue(e.target.value)}
                    aria-label="Valor de caja personalizado"
                    className="w-14 bg-transparent px-2 py-1 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSpawnCrate(Number(customCrateValue))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-l border-slate-200 dark:border-slate-600"
                  >
                    {t('simSendCrate')}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {([1, 1.5, 2] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`px-2.5 py-1.5 font-mono tabular-nums transition-colors ${
                        speed === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => resetCameraFnRef.current?.()}
                  title={t('simResetCamera')}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Isolated Three.js WebGL Mount + Solid Non-Blurred Hint Badge */}
          <div className={`relative w-full ${compact ? 'h-[360px] sm:h-[420px]' : 'h-[430px] sm:h-[510px]'}`}>
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            <button
              type="button"
              onClick={() => resetCameraFnRef.current?.()}
              className="absolute top-3 right-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-xs hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t('simDragHint')}
            </button>
          </div>
        </div>

        {/* Right Panel: Live Animated Registro & Tally */}
        <aside className="lg:col-span-3 flex flex-col bg-slate-50/70 dark:bg-[#0D1320] max-h-[680px]">
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('simLogTitle')}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-3 h-3" />
              {activeFormula.mode}
            </span>
          </div>

          {/* Live Metric Strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-center">
            <div className="py-2.5 px-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                VERD.
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {trueCount}
              </p>
            </div>
            <div className="py-2.5 px-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                FALSO
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
                {falseCount}
              </p>
            </div>
            <div className="py-2.5 px-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {activeFormula.mode === 'SUMAR.SI' ? 'SUMA' : 'TOTAL'}
              </p>
              <p className="text-sm font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {activeFormula.mode === 'SUMAR.SI' ? trueSum : trueCount + falseCount}
              </p>
            </div>
          </div>

          {/* Live Log Entries */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/80 px-3 py-2">
            <AnimatePresence initial={false}>
              {logs.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="py-2.5 flex items-center gap-2.5 text-xs font-mono"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      entry.kind === 'true'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : entry.kind === 'false'
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {entry.badge}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{entry.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#107C41] shrink-0" />
            <span className="truncate">
              {activeFormula.mode === 'SI'
                ? `Criterio activo: [Caja] ${activeFormula.operator} ${activeFormula.threshold}`
                : activeFormula.mode === 'CONTAR.SI'
                  ? `Contando cajas ${activeFormula.operator} ${activeFormula.threshold}`
                  : `Sumando cajas ${activeFormula.operator} ${activeFormula.threshold}`}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
