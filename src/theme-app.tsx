import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { BiGithub, BiHeartFill, BiListUl, BiX } from 'react-bootstrap-icons-pro';
import {
  Button,
  CloseButton,
  Prose,
  Toc,
  collectTocHeadings,
  useActiveHeading,
  type TocHeading,
} from 'react-bootstrap-pro';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

import { MarkdownCodeBlock } from './components/markdown-code-block';
import { MarkdownHtml } from './components/markdown-html';
import { MarkdownLink } from './components/markdown-link';
import { MenuItems } from './components/menu-items';
import { PageNavigation } from './components/page-navigation';
import { SearchModal } from './components/search-modal';
import { SiteNavbar } from './components/site-navbar';
import { getProjectLinks } from './project-links';
import { createPageSearch } from './search';
import type { MarkdownComponents, VitedThemeProps } from './types';

const emptyLocales: string[] = [];

export function ThemeApp({
  pages,
  routes,
  routeIndex,
  title = '',
  description = '',
  favicon = '',
  supportedLocales = emptyLocales,
  menu,
  searchIndex = [],
  packageJSON = {},
}: VitedThemeProps): ReactElement {
  const locales = useMemo(
    () =>
      supportedLocales.length > 0
        ? supportedLocales
        : [...new Set(pages.map((item) => item.locale))],
    [pages, supportedLocales],
  );
  const [pathname, navigate] = useLocation();
  const route = routes[routeIndex[pathname] ?? -1];
  const locale = route?.locale ?? locales[0] ?? 'en';
  const Content = route ? pages[route.page].component : undefined;
  const { t, i18n } = useTranslation();
  const [mobileOpened, setMobileOpened] = useState(false);
  const [tocOpened, setTocOpened] = useState(false);
  const [searchOpened, setSearchOpened] = useState(false);
  const [tocHeadings, setTocHeadings] = useState<TocHeading[]>([]);
  const activeHeadingId = useActiveHeading(tocHeadings);
  // Collect the outline when a page mounts; the keyed wrapper remounts on navigation.
  const attachContent = useCallback((element: HTMLDivElement | null) => {
    setTocHeadings(
      element ? collectTocHeadings(element, { ignoreSelector: '.vited-heading-anchor' }) : [],
    );
    if (element) setTocOpened(false);
  }, []);
  const projectLinks = useMemo(() => getProjectLinks(packageJSON), [packageJSON]);
  const navigationPages = useMemo(
    () => pages.filter((item) => item.locale === locale),
    [pages, locale],
  );
  // A single page needs no navigation, unless the site configures a menu of its own.
  const showNavigation = (menu?.length ?? 0) > 0 || navigationPages.length > 1;
  const markdownComponents = useMemo<MarkdownComponents>(
    () => ({ a: MarkdownLink, html: MarkdownHtml, pre: MarkdownCodeBlock }),
    [],
  );
  const searchPages = useMemo(
    () => searchIndex.filter((item) => item.locale.toLowerCase() === locale.toLowerCase()),
    [searchIndex, locale],
  );
  const search = useMemo(() => createPageSearch(searchPages), [searchPages]);
  const navigation = menu?.length ? (
    <MenuItems
      entries={menu}
      locale={locale}
      activePath={route?.path}
      onNavigate={() => setMobileOpened(false)}
    />
  ) : (
    <PageNavigation
      pages={navigationPages}
      activePath={route?.path}
      onNavigate={() => setMobileOpened(false)}
    />
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpened(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function changeLocale(nextLocale: string) {
    // Keep the reader on the same route when it exists in the next locale.
    const nextRoute =
      routes.find((item) => item.path === route?.path && item.locale === nextLocale) ??
      routes.find((item) => item.locale === nextLocale);
    if (!nextRoute) return;
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    navigate(`${nextRoute.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className='vited-bs-app min-vh-100 d-flex flex-column'>
      <SiteNavbar
        title={title}
        description={description}
        favicon={favicon}
        projectLinks={projectLinks}
        showNavigation={showNavigation}
        navigationOpened={mobileOpened}
        onToggleNavigation={() => setMobileOpened((opened) => !opened)}
        searchEnabled={searchIndex.length > 0}
        onOpenSearch={() => setSearchOpened(true)}
        locales={locales}
        locale={locale}
        onChangeLocale={changeLocale}
      />
      <div className='d-flex flex-grow-1 align-items-stretch'>
        {showNavigation ? (
          <aside className='vited-bs-desktop-only border-end vited-bs-sidebar'>
            <div className='vited-bs-sidebar-inner p-3'>
              <div className='small fw-semibold fg-3 mb-2'>{t('navigation')}</div>
              <nav aria-label={t('navigation')}>
                <ul className='nav flex-column vited-bs-nav gap-1'>{navigation}</ul>
              </nav>
            </div>
          </aside>
        ) : undefined}
        <main className='flex-grow-1 vited-bs-main'>
          <div className='vited-bs-content-layout'>
            <Prose className='vited-bs-container py-3' key={pathname} ref={attachContent}>
              {Content ? (
                <Content components={markdownComponents} />
              ) : (
                <p className='fg-3'>{t('noDocuments')}</p>
              )}
            </Prose>
            <aside className='vited-bs-toc' aria-hidden={tocHeadings.length > 0 ? undefined : true}>
              <div className='vited-bs-toc-inner'>
                {tocHeadings.length > 0 ? (
                  <>
                    <div className='small fw-semibold fg-3 mb-2'>{t('tableOfContents')}</div>
                    <Toc
                      headings={tocHeadings}
                      activeId={activeHeadingId}
                      label={t('tableOfContents')}
                      className='vited-bs-toc-tree'
                    />
                  </>
                ) : undefined}
              </div>
            </aside>
          </div>
        </main>
      </div>
      {showNavigation && mobileOpened ? (
        <div className='vited-bs-mobile-only'>
          <button
            type='button'
            className='vited-bs-offcanvas-backdrop'
            aria-label={t('closeNavigation')}
            onClick={() => setMobileOpened(false)}
          />
          <aside className='vited-bs-offcanvas-panel bg-body border-end p-3'>
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <span className='small fw-semibold fg-3'>{t('navigation')}</span>
              <CloseButton label={t('closeNavigation')} onClick={() => setMobileOpened(false)} />
            </div>
            <nav aria-label={t('navigation')}>
              <ul className='nav flex-column vited-bs-nav gap-1'>{navigation}</ul>
            </nav>
            {projectLinks.github || projectLinks.funding ? (
              <div className='vited-bs-offcanvas-links border-top mt-3 pt-3 d-flex flex-wrap gap-2'>
                {projectLinks.github ? (
                  <Button
                    component='a'
                    variant='outline'
                    theme='secondary'
                    href={projectLinks.github}
                    target='_blank'
                    rel='noreferrer'
                    className='d-flex align-items-center gap-2'
                  >
                    <BiGithub size={18} />
                    {t('github')}
                  </Button>
                ) : undefined}
                {projectLinks.funding ? (
                  <Button
                    component='a'
                    variant='outline'
                    theme='secondary'
                    href={projectLinks.funding}
                    target='_blank'
                    rel='noreferrer'
                    className='d-flex align-items-center gap-2'
                  >
                    <BiHeartFill size={18} color='red' />
                    {t('donate')}
                  </Button>
                ) : undefined}
              </div>
            ) : undefined}
          </aside>
        </div>
      ) : undefined}
      {tocHeadings.length > 0 ? (
        <>
          <Button
            variant='solid'
            theme='primary'
            className='rounded-circle shadow vited-bs-toc-toggle'
            aria-label={tocOpened ? t('closeTableOfContents') : t('openTableOfContents')}
            aria-expanded={tocOpened}
            onClick={() => setTocOpened((opened) => !opened)}
          >
            {tocOpened ? <BiX size={22} /> : <BiListUl size={22} />}
          </Button>
          {tocOpened ? (
            <div className='vited-bs-toc-mobile'>
              <button
                type='button'
                className='vited-bs-offcanvas-backdrop'
                aria-label={t('closeTableOfContents')}
                onClick={() => setTocOpened(false)}
              />
              <aside className='vited-bs-toc-panel bg-body border-start p-3'>
                <div className='d-flex align-items-center justify-content-between mb-2'>
                  <span className='small fw-semibold fg-3'>{t('tableOfContents')}</span>
                  <CloseButton
                    label={t('closeTableOfContents')}
                    onClick={() => setTocOpened(false)}
                  />
                </div>
                <Toc
                  headings={tocHeadings}
                  activeId={activeHeadingId}
                  label={t('tableOfContents')}
                  className='vited-bs-toc-tree'
                  onNavigate={() => setTocOpened(false)}
                />
              </aside>
            </div>
          ) : undefined}
        </>
      ) : undefined}
      {searchIndex.length > 0 && searchOpened ? (
        <SearchModal
          search={search}
          onNavigate={(path) => {
            navigate(path);
            setMobileOpened(false);
          }}
          onClose={() => setSearchOpened(false)}
        />
      ) : undefined}
    </div>
  );
}
