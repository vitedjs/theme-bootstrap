import { useEffect, useRef, useState } from 'react';
import { BiCheck, BiChevronDown, BiGlobe2 } from 'react-bootstrap-icons-pro';
import { Button } from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

interface LocaleSelectProps {
  locale: string;
  locales: string[];
  onChange: (locale: string) => void;
}

/** Bootstrap-themed locale picker; Bootstrap 6 has no styled select component. */
export function LocaleSelect({ locale, locales, onChange }: LocaleSelectProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const localeLabel = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;

  useEffect(() => {
    if (!opened) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpened(false);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpened(false);
    }
    globalThis.document.addEventListener('pointerdown', onPointerDown);
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.document.removeEventListener('pointerdown', onPointerDown);
      globalThis.document.removeEventListener('keydown', onKeyDown);
    };
  }, [opened]);

  return (
    <div ref={rootRef} className='vited-bs-locale'>
      <Button
        variant='outline'
        theme='secondary'
        className='vited-bs-mobile-icon-button d-flex align-items-center gap-2'
        aria-label={`${t('language')}: ${localeLabel}`}
        title={`${t('language')}: ${localeLabel}`}
        aria-expanded={opened}
        aria-haspopup='menu'
        onClick={() => setOpened((value) => !value)}
      >
        <BiGlobe2 size={20} />
        <span className='vited-bs-locale-label'>{localeLabel}</span>
        <BiChevronDown size={14} className='vited-bs-locale-caret' />
      </Button>
      {opened ? (
        <div className='vited-bs-locale-menu' role='menu'>
          {locales.map((item) => (
            <button
              key={item}
              type='button'
              className='vited-bs-locale-item'
              role='menuitemradio'
              aria-checked={item === locale}
              onClick={() => {
                onChange(item);
                setOpened(false);
              }}
            >
              {new Intl.DisplayNames([item], { type: 'language' }).of(item) ?? item}
              <BiCheck size={16} className='vited-bs-locale-check ms-auto' aria-hidden='true' />
            </button>
          ))}
        </div>
      ) : undefined}
    </div>
  );
}
