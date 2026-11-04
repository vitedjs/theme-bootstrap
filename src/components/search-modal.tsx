import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BiSearch } from 'react-bootstrap-icons-pro';
import { CloseButton } from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

import type { SearchDocument } from '../search';

interface SearchModalProps {
  search: (query: string) => SearchDocument[];
  onNavigate: (pathname: string) => void;
  onClose: () => void;
}

export function SearchModal({ search, onNavigate, onClose }: SearchModalProps): ReactElement {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(query).slice(0, 8), [search, query]);

  useEffect(() => {
    inputRef.current?.focus();
    globalThis.document.documentElement.classList.add('dialog-open');
    return () => globalThis.document.documentElement.classList.remove('dialog-open');
  }, []);

  function select(item: SearchDocument) {
    onNavigate(item.pathname);
    onClose();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const item = results[activeIndex];
      if (item) select(item);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <>
      <button
        type='button'
        className='vited-bs-modal-backdrop'
        aria-label={t('close')}
        onClick={onClose}
      />
      <dialog
        open
        className='dialog vited-bs-search-dialog'
        aria-modal='true'
        aria-label={t('search')}
      >
        <div className='dialog-header d-flex align-items-center gap-2'>
          <BiSearch size={16} className='fg-3 flex-shrink-0' />
          <input
            ref={inputRef}
            type='search'
            className='form-control'
            placeholder={t('searchPlaceholder')}
            aria-label={t('search')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
          />
          <CloseButton className='flex-shrink-0' label={t('close')} onClick={onClose} />
        </div>
        <div className='dialog-body p-0 vited-bs-search-results'>
          {results.length > 0 ? (
            <div className='list-group list-group-flush'>
              {results.map((item, index) => (
                <button
                  key={`${item.locale}:${item.pathname}`}
                  type='button'
                  className={`list-group-item list-group-item-action${index === activeIndex ? ' active' : ''}`}
                  ref={
                    index === activeIndex
                      ? (element) => element?.scrollIntoView({ block: 'nearest' })
                      : undefined
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(item)}
                >
                  <div className='fw-semibold'>{highlightText(item.title, query)}</div>
                  <div className={`small text-truncate${index === activeIndex ? '' : ' fg-3'}`}>
                    {highlightText(item.content.slice(0, 140), query)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className='fg-3 p-3 mb-0'>{t('noSearchResults')}</p>
          )}
        </div>
      </dialog>
    </>
  );
}

function highlightText(text: string, query: string): ReactNode {
  const needle = query.trim().toLowerCase();
  if (!needle) return text;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let index = 0;
  let found = lower.indexOf(needle);
  while (found !== -1) {
    if (found > index) parts.push(text.slice(index, found));
    parts.push(<mark key={found}>{text.slice(found, found + needle.length)}</mark>);
    index = found + needle.length;
    found = lower.indexOf(needle, index);
  }
  parts.push(text.slice(index));
  return parts;
}
