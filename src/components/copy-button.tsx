import { useEffect, useState } from 'react';
import { BiCheck, BiClipboard } from 'react-bootstrap-icons-pro';
import { useTranslation } from 'react-i18next';

export function CopyButton({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = globalThis.setTimeout(() => setCopied(false), 2000);
    return () => globalThis.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type='button'
      className='vited-bs-copy-button'
      aria-label={copied ? t('copied') : t('copy')}
      title={copied ? t('copied') : t('copy')}
      onClick={() => {
        void globalThis.navigator?.clipboard?.writeText(code).catch(() => {});
        setCopied(true);
      }}
    >
      {copied ? <BiCheck size={16} /> : <BiClipboard size={16} />}
    </button>
  );
}
