import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Router } from 'wouter';

import { themeI18n } from './i18n';
import { ThemeApp } from './theme-app';
import type { VitedThemeProps } from './types';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

export type { VitedMenuEntry, VitedPage, VitedRoute, VitedThemeProps } from './types';

export function VitedTheme(props: VitedThemeProps): ReactElement {
  return (
    <I18nextProvider i18n={themeI18n}>
      <Router base={props.basePath ?? ''}>
        <ThemeApp {...props} />
      </Router>
    </I18nextProvider>
  );
}

export default VitedTheme;
