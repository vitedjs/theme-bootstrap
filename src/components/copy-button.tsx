import { useEffect, useState } from 'react';
import { BiCheck2, BiClipboard } from 'react-bootstrap-icons-pro';
import { IconButton } from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

export function CopyButton({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <IconButton
      position='absolute'
      variant={copied ? 'subtle' : 'outline'}
      theme={copied ? 'success' : 'secondary'}
      size='xs'
      aria-label={copied ? t('copied') : t('copy')}
      title={copied ? t('copied') : t('copy')}
      onClick={() => {
        if (typeof navigator !== 'undefined') {
          void navigator.clipboard?.writeText(code).catch(() => {});
        }
        setCopied(true);
      }}
      style={{ top: '0.5rem', right: '0.5rem' }}
    >
      {copied ? <BiCheck2 size={16} /> : <BiClipboard size={16} />}
    </IconButton>
  );
}
