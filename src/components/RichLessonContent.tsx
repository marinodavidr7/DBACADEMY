import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OperadoresComparacionSimulator } from './OperadoresComparacionSimulator';
import {
  hasComparisonSimulatorEmbed,
  renderLessonContent,
  replaceComparisonSimulatorEmbeds,
} from '../utils/richText';

interface RichLessonContentProps {
  content: string;
  className?: string;
  onInteract?: () => void;
}

export const RichLessonContent: React.FC<RichLessonContentProps> = ({
  content,
  className = '',
  onInteract,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [simNodes, setSimNodes] = useState<HTMLElement[]>([]);

  const html = useMemo(() => {
    const rendered = renderLessonContent(content || '');
    if (!rendered) return '';
    if (!hasComparisonSimulatorEmbed(content || '') && !/<div[^>]+data-sim="operadores-comparacion"/i.test(rendered)) {
      return rendered;
    }
    return replaceComparisonSimulatorEmbeds(rendered);
  }, [content]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      setSimNodes([]);
      return;
    }
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-sim="operadores-comparacion"]'));
    setSimNodes(nodes);
  }, [html]);

  if (!html) return null;

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {simNodes.map((node, idx) =>
        createPortal(
          <OperadoresComparacionSimulator onInteract={onInteract} />,
          node,
          `cmp-sim-${idx}`
        )
      )}
    </>
  );
};

export default RichLessonContent;
