import type { ReactElement } from 'react';

import type { TocHeading } from '../toc';

interface TocTreeProps {
  headings: TocHeading[];
  activeId?: string;
  ariaLabel: string;
  onNavigate?: () => void;
  nested?: boolean;
}

export function TocTree({
  headings,
  activeId,
  ariaLabel,
  onNavigate,
  nested,
}: TocTreeProps): ReactElement {
  const list = (
    <ul className={nested ? 'vited-bs-toc-sublist' : 'nav flex-column vited-bs-toc-nav'}>
      {headings.map((heading) => (
        <li key={heading.id} className='nav-item'>
          <a
            href={`#${heading.id}`}
            className={`nav-link${heading.id === activeId ? ' active' : ''}`}
            style={{ paddingInlineStart: 12 + (heading.level - 2) * 12 }}
            aria-current={heading.id === activeId ? 'location' : undefined}
            onClick={onNavigate}
          >
            {heading.text}
          </a>
          {heading.children.length > 0 ? (
            <TocTree
              headings={heading.children}
              activeId={activeId}
              ariaLabel={ariaLabel}
              onNavigate={onNavigate}
              nested
            />
          ) : undefined}
        </li>
      ))}
    </ul>
  );

  return nested ? (
    list
  ) : (
    <nav aria-label={ariaLabel} className='vited-bs-toc-tree'>
      {list}
    </nav>
  );
}
