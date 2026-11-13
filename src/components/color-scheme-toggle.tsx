import type { ReactElement } from 'react';
import { BiMoon, BiSun } from 'react-bootstrap-icons-pro';
import { IconButton, useColorScheme } from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

/** Header button that switches between Bootstrap's light and dark color schemes. */
export function ColorSchemeToggle(): ReactElement {
  const { t } = useTranslation();
  const [colorScheme, setColorScheme] = useColorScheme();
  const label = colorScheme === 'dark' ? t('switchToLight') : t('switchToDark');

  return (
    <IconButton
      variant='outline'
      theme='secondary'
      className='flex-shrink-0'
      aria-label={label}
      title={label}
      onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
    >
      {colorScheme === 'dark' ? <BiSun size={20} /> : <BiMoon size={20} />}
    </IconButton>
  );
}
