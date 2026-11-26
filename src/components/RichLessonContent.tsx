import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderLessonContent, replaceSimulatorEmbedsWithPortals } from '../utils/richText';
import { LogicOperatorSimulator } from './LogicOperatorSimulator';

interface RichLessonContentProps {
  content: string;
  className?: string;
  onInteract?: () => void;
}

/**
 * Renders sanitized lesson HTML and upgrades comparison-operator embeds/tokens
 * into live React portals using LogicOperatorSimulator (no iframe).
 */
export const RichLessonContent: React.FC<RichLessonContentProps> = ({
  content,
  className = '',
  onInteract,
}) => {
  const htmlHostRef = useRef<HTMLDivElement | null>(null);
  const [portalTargets, setPortalTargets] = useState<HTMLElement[]>([]);

  const processedHtml = useMemo(() => {
    const rendered = renderLessonContent(content);
    return replaceSimulatorEmbedsWithPortals(rendered);
  }, [content]);

  useLayoutEffect(() => {
    const host = htmlHostRef.current;
    if (!host) {
      setPortalTargets([]);
      return;
    }
    host.innerHTML = processedHtml;
    const targets = Array.from(
      host.querySelectorAll<HTMLElement>('.dba-sim-operadores-comparacion')
    );
    setPortalTargets(targets);

    return () => {
      setPortalTargets([]);
      if (htmlHostRef.current) {
        htmlHostRef.current.innerHTML = '';
      }
    };
  }, [processedHtml]);

  return (
    <>
      <div ref={htmlHostRef} className={className} />
      {portalTargets.map((target, idx) =>
        createPortal(
          <LogicOperatorSimulator
            key={`op-comp-portal-${idx}`}
            onInteract={onInteract}
          />,
          target
        )
      )}
    </>
  );
};
