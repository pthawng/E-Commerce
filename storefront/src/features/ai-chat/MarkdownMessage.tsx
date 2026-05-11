import React from 'react';
import { cn } from '@/lib/utils';

type InlineNode = { type: 'text' | 'bold' | 'italic'; content: string };

function parseInlineNodes(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  // Bold (**) must be checked before italic (*) to avoid mismatches
  const pattern = /\*\*(.+?)\*\*|\*([^*\n]+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ type: 'bold', content: match[1] });
    } else if (match[2] !== undefined) {
      nodes.push({ type: 'italic', content: match[2] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', content: text }];
}

function renderInlineNodes(nodes: InlineNode[], baseKey: string): React.ReactNode {
  return nodes.map((node, i) => {
    const key = `${baseKey}-${i}`;
    if (node.type === 'bold') {
      return <strong key={key} className="font-semibold">{node.content}</strong>;
    }
    if (node.type === 'italic') {
      return <em key={key} className="italic opacity-90">{node.content}</em>;
    }
    return <React.Fragment key={key}>{node.content}</React.Fragment>;
  });
}

export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

/**
 * Lightweight whitelist-based markdown renderer.
 * Supports: **bold**, *italic*, - bullet lists, newlines.
 * No dangerouslySetInnerHTML. XSS-safe by construction.
 */
export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let bulletItems: string[] = [];
  let blockKey = 0;

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    const items = [...bulletItems];
    blocks.push(
      <ul key={`ul-${blockKey++}`} className="my-1.5 space-y-1 list-none pl-0">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 items-start leading-relaxed">
            <span
              className="mt-[0.45em] h-1 w-1 flex-shrink-0 rounded-full bg-current opacity-40"
              aria-hidden
            />
            <span className="flex-1">
              {renderInlineNodes(parseInlineNodes(item), `li-${blockKey}-${i}`)}
            </span>
          </li>
        ))}
      </ul>,
    );
    bulletItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet lines: "- text" or "* text" but NOT "** bold **"
    const bulletMatch = line.match(/^[-*]\s+([^*].*|$)/);
    if (bulletMatch) {
      bulletItems.push(bulletMatch[1] ?? '');
      continue;
    }

    flushBullets();

    if (line.trim() === '') {
      // Add gap between paragraphs but skip leading/trailing blanks
      if (i > 0 && i < lines.length - 1) {
        blocks.push(<div key={`sp-${blockKey++}`} className="h-1.5" />);
      }
    } else {
      const key = blockKey++;
      blocks.push(
        <p key={`p-${key}`} className="leading-relaxed [&+p]:mt-1">
          {renderInlineNodes(parseInlineNodes(line), `p-${key}`)}
        </p>,
      );
    }
  }

  flushBullets();

  return (
    <div
      className={cn(
        'text-sm [overflow-wrap:anywhere] [word-break:break-word]',
        className,
      )}
    >
      {blocks}
    </div>
  );
};
