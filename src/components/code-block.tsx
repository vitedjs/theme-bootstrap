import { useEffect, useState } from 'react';
import { createHighlighter, type BundledLanguage } from 'shiki';

import { CopyButton } from './copy-button';

const highlightLanguages: BundledLanguage[] = [
  'bash',
  'css',
  'diff',
  'html',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'mdx',
  'shellscript',
  'typescript',
  'tsx',
  'yaml',
];

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function getHighlighter(): ReturnType<typeof createHighlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: highlightLanguages,
  });
  return highlighterPromise;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const normalized = language?.toLowerCase();
        const lang = (
          normalized && highlighter.getLoadedLanguages().includes(normalized) ? normalized : 'text'
        ) as BundledLanguage;
        setHtml(
          highlighter.codeToHtml(code, {
            lang,
            themes: { light: 'github-light', dark: 'github-dark' },
          }),
        );
      })
      .catch(() => {
        // Highlighting is best-effort; the plain code fallback stays visible.
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <div className='vited-bs-code-block position-relative border rounded'>
      <CopyButton code={code} />
      {html ? (
        <div className='vited-bs-code' dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className='mb-0 p-3 vited-bs-code-plain'>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
