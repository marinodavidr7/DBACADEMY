const STORAGE_JWK_KEY = 'dba_e2ee_master_jwk_v1';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrCreateVaultKey(): Promise<{ key: CryptoKey; fingerprint: string }> {
  const saved = localStorage.getItem(STORAGE_JWK_KEY);
  let key: CryptoKey;
  if (saved) {
    const jwk = JSON.parse(saved) as JsonWebKey;
    key = await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
  } else {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);
    const exported = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(STORAGE_JWK_KEY, JSON.stringify(exported));
  }
  const jwk = await crypto.subtle.exportKey('jwk', key);
  const hash = await sha256Hex(String(jwk.k || 'dba'));
  const fingerprint = hash.slice(0, 16).toUpperCase();
  return { key, fingerprint };
}

export async function rotateVaultKeyFromPassphrase(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const salt = enc.encode('dba-e2ee-salt-2026');
  const derived = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const jwk = await crypto.subtle.exportKey('jwk', derived);
  localStorage.setItem(STORAGE_JWK_KEY, JSON.stringify(jwk));
  const hash = await sha256Hex(String(jwk.k || passphrase));
  return hash.slice(0, 16).toUpperCase();
}

export async function exportVaultKeyJson(): Promise<string> {
  const saved = localStorage.getItem(STORAGE_JWK_KEY);
  if (!saved) {
    await getOrCreateVaultKey();
  }
  return localStorage.getItem(STORAGE_JWK_KEY) ?? '{}';
}

export async function importVaultKeyJson(jwkString: string): Promise<string> {
  const jwk = JSON.parse(jwkString) as JsonWebKey;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const exported = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(STORAGE_JWK_KEY, JSON.stringify(exported));
  const hash = await sha256Hex(String(exported.k || 'dba'));
  return hash.slice(0, 16).toUpperCase();
}

export async function encryptTextE2EE(
  plaintext: string
): Promise<{ ciphertext: string; iv: string; algorithm: 'AES-GCM-256'; keyFingerprint: string }> {
  const { key, fingerprint } = await getOrCreateVaultKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    algorithm: 'AES-GCM-256',
    keyFingerprint: fingerprint,
  };
}

export async function decryptTextE2EE(ciphertext: string, ivB64: string): Promise<string> {
  const { key } = await getOrCreateVaultKey();
  const ivBytes = fromBase64(ivB64);
  const cipherBytes = fromBase64(ciphertext);
  const ivCopy = new Uint8Array(ivBytes.length);
  ivCopy.set(ivBytes);
  const cipherCopy = new Uint8Array(cipherBytes.length);
  cipherCopy.set(cipherBytes);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivCopy },
    key,
    cipherCopy
  );
  return new TextDecoder().decode(decrypted);
}
