import { useLocalStorage } from '@guoyunhe/react-storage';
import type { ReactElement } from 'react';
import { BiCheckLg, BiCircleHalf, BiMoon, BiSun } from 'react-bootstrap-icons-pro';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuItemIcon,
  colorSchemeStorageKey,
  useColorScheme,
  type ColorScheme,
} from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

const colorSchemes: ColorScheme[] = ['auto', 'light', 'dark'];

const icons: Record<ColorScheme, typeof BiSun> = {
  auto: BiCircleHalf,
  light: BiSun,
  dark: BiMoon,
};

/** Header menu that selects between the automatic, light, and dark color schemes. */
export function ColorSchemeToggle(): ReactElement {
  const { t } = useTranslation();
  const [storedColorScheme] = useLocalStorage<ColorScheme>(colorSchemeStorageKey, 'auto');
  const [, setColorScheme] = useColorScheme();
  const colorScheme = isColorScheme(storedColorScheme) ? storedColorScheme : 'auto';
  const labels: Record<ColorScheme, string> = {
    auto: t('colorSchemeAuto'),
    light: t('colorSchemeLight'),
    dark: t('colorSchemeDark'),
  };
  const TriggerIcon = icons[colorScheme];
  const triggerLabel = `${t('colorScheme')}: ${labels[colorScheme]}`;

  return (
    <Menu
      role='menu'
      placement='bottom-end'
      trigger={
        <IconButton
          variant='outline'
          theme='secondary'
          className='flex-shrink-0'
          aria-label={triggerLabel}
          aria-haspopup='menu'
          title={triggerLabel}
        >
          <TriggerIcon size={20} />
        </IconButton>
      }
    >
      {colorSchemes.map((value) => {
        const Icon = icons[value];
        const selected = value === colorScheme;
        return (
          <MenuItem
            key={value}
            component='button'
            type='button'
            role='menuitemradio'
            aria-checked={selected}
            className={selected ? 'selected' : undefined}
            onClick={() => setColorScheme(value)}
          >
            <MenuItemIcon fg='3' aria-hidden='true'>
              <Icon size='1rem' />
            </MenuItemIcon>
            {labels[value]}
            <BiCheckLg className='menu-item-check' aria-hidden='true' />
          </MenuItem>
        );
      })}
    </Menu>
  );
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'auto' || value === 'light' || value === 'dark';
}
