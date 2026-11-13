import type { ReactElement } from 'react';
import { BiGithub, BiHeartFill, BiList, BiSearch, BiX } from 'react-bootstrap-icons-pro';
import { Box, Button, Container, IconButton, Navbar } from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';

import type { ProjectLinks } from '../project-links';
import { ColorSchemeToggle } from './color-scheme-toggle';
import { LocaleSelect } from './locale-select';

interface SiteNavbarProps {
  title: string;
  description: string;
  favicon: string;
  projectLinks: ProjectLinks;
  showNavigation: boolean;
  navigationOpened: boolean;
  onToggleNavigation: () => void;
  searchEnabled: boolean;
  onOpenSearch: () => void;
  locales: string[];
  locale: string;
  onChangeLocale: (locale: string) => void;
}

export function SiteNavbar({
  title,
  description,
  favicon,
  projectLinks,
  showNavigation,
  navigationOpened,
  onToggleNavigation,
  searchEnabled,
  onOpenSearch,
  locales,
  locale,
  onChangeLocale,
}: SiteNavbarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Navbar component='header' className='bg-body border-bottom sticky-top vited-bs-header'>
      <Container
        fluid
        className='h-100'
        d='flex'
        alignItems='center'
        flexWrap='nowrap'
        gap={2}
        px={3}
      >
        {showNavigation ? (
          <IconButton
            variant='outline'
            theme='secondary'
            d={{ xs: 'flex', md: 'none' }}
            aria-label={navigationOpened ? t('closeNavigation') : t('openNavigation')}
            aria-expanded={navigationOpened}
            onClick={onToggleNavigation}
          >
            {navigationOpened ? <BiX size={20} /> : <BiList size={20} />}
          </IconButton>
        ) : undefined}
        {favicon ? (
          <img src={favicon} alt='' width={24} height={24} className='object-fit-contain' />
        ) : undefined}
        <Box className='vited-bs-header-title'>
          <Box fontWeight='bold' textTruncate>
            {title || 'Documentation'}
          </Box>
          {description ? (
            <Box fg='3' fontSize='sm' textTruncate className='vited-bs-sm-up'>
              {description}
            </Box>
          ) : undefined}
        </Box>
        <Box
          ms='auto'
          d='flex'
          alignItems='center'
          flexWrap='nowrap'
          className={`vited-bs-header-actions${showNavigation ? ' vited-bs-has-navigation' : ''}`}
        >
          {searchEnabled ? (
            <Button
              variant='outline'
              theme='secondary'
              className='vited-bs-search-button vited-bs-mobile-icon-button'
              d='flex'
              alignItems='center'
              justifyContent='between'
              gap={2}
              aria-label={`${t('search')} ${getSearchShortcut()}`}
              onClick={onOpenSearch}
            >
              <Box component='span' d='inline-flex' alignItems='center' gap={2}>
                <BiSearch size={20} />
                <Box component='span' className='vited-bs-search-label'>
                  {t('search')}
                </Box>
              </Box>
              <Box component='kbd' className='small vited-bs-search-shortcut'>
                {getSearchShortcut()}
              </Box>
            </Button>
          ) : undefined}
          {projectLinks.github ? (
            <IconButton
              component='a'
              variant='outline'
              theme='secondary'
              href={projectLinks.github}
              target='_blank'
              rel='noreferrer'
              className='vited-bs-project-link flex-shrink-0'
              aria-label={t('github')}
              title={t('github')}
            >
              <BiGithub size={20} />
            </IconButton>
          ) : undefined}
          {projectLinks.funding ? (
            <IconButton
              component='a'
              variant='outline'
              theme='secondary'
              href={projectLinks.funding}
              target='_blank'
              rel='noreferrer'
              className='vited-bs-project-link flex-shrink-0'
              aria-label={t('donate')}
              title={t('donate')}
            >
              <BiHeartFill size={20} color='red' />
            </IconButton>
          ) : undefined}
          {locales.length > 1 ? (
            <LocaleSelect locale={locale} locales={locales} onChange={onChangeLocale} />
          ) : undefined}
          <ColorSchemeToggle />
        </Box>
      </Container>
    </Navbar>
  );
}

function getSearchShortcut(): string {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    ? '⌘K'
    : 'Ctrl+K';
}
