import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Render tokens: handles code blocks, math formulas, headers, tables, lists, text formatting
  const renderFormattedContent = (text: string) => {
    // 1. Split code blocks (```lang ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2].trimEnd()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <CodeBlock 
            key={idx} 
            language={part.language!} 
            code={part.code!} 
          />
        );
      }
      return <TextBlock key={idx} text={part.content!} />;
    });
  };

  return (
    <div className="prose prose-invert max-w-none text-slate-100 leading-relaxed text-[15px] space-y-3">
      {renderFormattedContent(content)}
    </div>
  );
};

// Code block with copy button, syntax styling, language badge, and line numbers
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/80 bg-[#090d16] shadow-xl">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300 font-semibold uppercase tracking-wider">{language || 'CODE'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Line Numbers */}
      <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#0b0f19]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, lineIdx) => (
              <tr key={lineIdx} className="hover:bg-slate-800/30">
                <td className="pr-4 text-right select-none text-slate-600 w-8 text-xs align-top">
                  {lineIdx + 1}
                </td>
                <td className="text-slate-200 whitespace-pre font-mono">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Text block that parses Markdown headers, math formulas, lists, blockquotes, bold/italics
const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  // Split lines
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2 text-slate-300">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // LaTeX Math block: $$ ... $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      flushList();
      const math = trimmed.slice(2, -2).trim();
      elements.push(
        <div key={idx} className="my-3 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 font-mono text-center overflow-x-auto shadow-inner">
          <span className="text-xs text-indigo-400 block mb-1 font-sans">Formula:</span>
          {math}
        </div>
      );
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={idx} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">{parseInlineStyles(trimmed.slice(4))}</h3>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={idx} className="text-xl font-bold text-white mt-5 mb-2.5 border-b border-slate-800 pb-1.5">{parseInlineStyles(trimmed.slice(3))}</h2>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={idx} className="text-2xl font-extrabold text-white mt-6 mb-3">{parseInlineStyles(trimmed.slice(2))}</h1>);
      return;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      elements.push(<hr key={idx} className="my-4 border-slate-800" />);
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={idx} className="border-l-4 border-indigo-500/80 pl-3 py-1 my-2 bg-indigo-950/20 text-slate-300 italic rounded-r-md">
          {parseInlineStyles(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Bullet List item
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      listItems.push(
        <li key={idx} className="text-slate-300">
          {parseInlineStyles(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={idx} className="flex items-start gap-2 my-1.5 text-slate-300">
          <span className="font-semibold text-indigo-400 min-w-[20px]">{numMatch[1]}.</span>
          <div>{parseInlineStyles(numMatch[2])}</div>
        </div>
      );
      return;
    }

    // Regular line
    flushList();
    if (trimmed.length > 0) {
      elements.push(
        <p key={idx} className="my-1.5 text-slate-200 leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  flushList();
  return <>{elements}</>;
};

// Inline parser for **bold**, *italic*, `inline code`, and $inline math$
function parseInlineStyles(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Tokenize bold, italic, code, math
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      result.push(<strong key={match.index} className="font-bold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      result.push(<em key={match.index} className="italic text-slate-300">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      result.push(
        <code key={match.index} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 text-[13px] font-mono">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('$') && token.endsWith('$')) {
      result.push(
        <span key={match.index} className="px-1.5 py-0.5 mx-0.5 rounded bg-indigo-950/40 text-indigo-300 font-mono text-xs border border-indigo-500/30">
          {token.slice(1, -1)}
        </span>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}
