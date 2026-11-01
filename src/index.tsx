import parse, { Element as HtmlElement, type DOMNode } from 'html-react-parser';
import React, {
  type ComponentType,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Children, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BiCheck,
  BiChevronDown,
  BiClipboard,
  BiGithub,
  BiGlobe2,
  BiHeartFill,
  BiList,
  BiListUl,
  BiMoon,
  BiSearch,
  BiSun,
  BiX,
} from 'react-bootstrap-icons-pro';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { createHighlighter, type BundledLanguage } from 'shiki';
import { Link, Router, useLocation } from 'wouter';

import { themeI18n } from './i18n';
import { getProjectLinks } from './project-links';
import { createPageSearch, type SearchDocument } from './search';
import { collectTocHeadings, useActiveHeading, type TocHeading } from './toc';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const highlightLanguages: BundledLanguage[] = [
  'bash',
  'css',
  'diff',
  'html',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'mdx',
  'shellscript',
  'typescript',
  'tsx',
  'yaml',
];

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function getHighlighter(): ReturnType<typeof createHighlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: highlightLanguages,
  });
  return highlighterPromise;
}

const emptyLocales: string[] = [];

const colorSchemeStorageKey = 'vited-theme-bootstrap-color-scheme';

interface MarkdownElementProps {
  children?: ReactNode;
  html?: string;
}

type MarkdownComponents = Record<string, ComponentType<MarkdownElementProps>>;

export interface VitedPage {
  /** Route without locale prefix, e.g. `/guide/start`. */
  path: string;
  locale: string;
  /** Path matched by the client router, e.g. `/zh/guide/start/`. */
  pathname: string;
  /** Page URL with the base URL, e.g. `/docs/zh/guide/start/`. */
  url: string;
  title: string;
  frontmatter: Record<string, unknown>;
  component: ComponentType<{ components?: MarkdownComponents }>;
}

export interface VitedRoute {
  /** Route without locale prefix, e.g. `/guide/start`. */
  path: string;
  locale: string;
  /** Path matched by the client router, e.g. `/zh/guide/start/`. */
  pathname: string;
  /** Page URL with the base URL, e.g. `/docs/zh/guide/start/`. */
  url: string;
  /** Index of the page that renders this route. */
  page: number;
}

export interface VitedMenuEntry {
  divider?: boolean;
  text?: string;
  path?: string;
  /** Pathnames of the entry per locale, e.g. `{ en: '/guide/', zh: '/zh/guide/' }`. */
  pathnames?: Record<string, string>;
  /** URLs of the entry per locale, e.g. `{ en: '/docs/guide/', zh: '/docs/zh/guide/' }`. */
  urls?: Record<string, string>;
  file?: string;
  link?: string;
  flag?: 'experimental' | 'new' | 'deprecated';
  children?: VitedMenuEntry[];
}

export interface VitedThemeProps {
  pages: VitedPage[];
  /** Every page route in every configured locale, with the page that renders it. */
  routes: VitedRoute[];
  /** Route lookup by pathname, with and without the trailing slash. */
  routeIndex: Record<string, number>;
  title?: string;
  description?: string;
  /** Project favicon URL, displayed to the left of the title. */
  favicon?: string;
  supportedLocales?: string[];
  baseURL?: string;
  /** Base URL of the client router, empty for the site root. */
  basePath?: string;
  menu?: VitedMenuEntry[] | null;
  searchIndex?: SearchDocument[];
  packageJSON?: Record<string, unknown>;
}

type ColorScheme = 'light' | 'dark';

function getSystemColorScheme(): ColorScheme {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readColorSchemePreference(): ColorScheme | 'auto' {
  try {
    const stored = globalThis.localStorage?.getItem(colorSchemeStorageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

/** Follows the system color scheme by default and persists explicit choices. */
function useColorScheme(): [ColorScheme, () => void] {
  const [preference, setPreference] = useState<ColorScheme | 'auto'>(readColorSchemePreference);
  const [system, setSystem] = useState<ColorScheme>(getSystemColorScheme);

  useEffect(() => {
    const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const scheme = preference === 'auto' ? system : preference;

  useEffect(() => {
    globalThis.document.documentElement.dataset.bsTheme = scheme;
  }, [scheme]);

  const toggle = useCallback(() => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    try {
      globalThis.localStorage?.setItem(colorSchemeStorageKey, next);
    } catch {
      // Storage may be unavailable, e.g. in private browsing.
    }
    setPreference(next);
  }, [scheme]);

  return [scheme, toggle];
}

function ThemeApp({
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
    setTocHeadings(element ? collectTocHeadings(element) : []);
    if (element) setTocOpened(false);
  }, []);
  const [colorScheme, toggleColorScheme] = useColorScheme();
  const projectLinks = useMemo(() => getProjectLinks(packageJSON), [packageJSON]);
  const navigationPages = useMemo(
    () => pages.filter((item) => item.locale === locale),
    [pages, locale],
  );
  // A single page needs no navigation, unless the site configures a menu of its own.
  const showNavigation = (menu?.length ?? 0) > 0 || navigationPages.length > 1;
  const markdownComponents = useMemo<MarkdownComponents>(
    () => ({ html: MarkdownHtml, pre: MarkdownCodeBlock }),
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
    globalThis.document.documentElement.lang = locale;
    void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpened(true);
      }
    }
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => globalThis.document.removeEventListener('keydown', onKeyDown);
  }, []);

  function changeLocale(nextLocale: string) {
    // Keep the reader on the same route when it exists in the next locale.
    const nextRoute =
      routes.find((item) => item.path === route?.path && item.locale === nextLocale) ??
      routes.find((item) => item.locale === nextLocale);
    if (!nextRoute) return;
    const url = new globalThis.URL(globalThis.location.href);
    url.searchParams.delete('lang');
    navigate(`${nextRoute.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className='vited-bs-app min-vh-100 d-flex flex-column'>
      <header className='navbar bg-body border-bottom sticky-top vited-bs-header'>
        <div className='container-fluid h-100 d-flex align-items-center gap-2 flex-nowrap px-3'>
          {showNavigation ? (
            <button
              type='button'
              className='btn btn-outline theme-secondary vited-bs-mobile-only'
              aria-label={mobileOpened ? t('closeNavigation') : t('openNavigation')}
              aria-expanded={mobileOpened}
              onClick={() => setMobileOpened((opened) => !opened)}
            >
              {mobileOpened ? <BiX size={20} /> : <BiList size={20} />}
            </button>
          ) : undefined}
          {favicon ? (
            <img src={favicon} alt='' width={24} height={24} className='object-fit-contain' />
          ) : undefined}
          <div className='vited-bs-header-title'>
            <div className='fw-bold text-truncate'>{title || 'Documentation'}</div>
            {description ? (
              <div className='fg-3 small text-truncate vited-bs-sm-up'>{description}</div>
            ) : undefined}
          </div>
          <div className='ms-auto d-flex align-items-center gap-2 flex-nowrap'>
            {searchIndex.length > 0 ? (
              <button
                type='button'
                className='btn btn-outline theme-secondary vited-bs-search-button d-flex align-items-center justify-content-between gap-2'
                aria-label={`${t('search')} ${getSearchShortcut()}`}
                onClick={() => setSearchOpened(true)}
              >
                <span className='d-inline-flex align-items-center gap-2'>
                  <BiSearch size={14} />
                  {t('search')}
                </span>
                <kbd className='small'>{getSearchShortcut()}</kbd>
              </button>
            ) : undefined}
            {projectLinks.github ? (
              <a
                href={projectLinks.github}
                target='_blank'
                rel='noreferrer'
                className='btn btn-outline theme-secondary'
                aria-label={t('github')}
                title={t('github')}
              >
                <BiGithub size={20} />
              </a>
            ) : undefined}
            {projectLinks.funding ? (
              <a
                href={projectLinks.funding}
                target='_blank'
                rel='noreferrer'
                className='btn btn-outline theme-secondary'
                aria-label={t('donate')}
                title={t('donate')}
              >
                <BiHeartFill size={18} color='red' />
              </a>
            ) : undefined}
            {locales.length > 1 ? (
              <LocaleSelect locale={locale} locales={locales} onChange={changeLocale} />
            ) : undefined}
            <button
              type='button'
              className='btn btn-outline theme-secondary'
              aria-label={colorScheme === 'dark' ? t('switchToLight') : t('switchToDark')}
              title={colorScheme === 'dark' ? t('switchToLight') : t('switchToDark')}
              onClick={toggleColorScheme}
            >
              {colorScheme === 'dark' ? <BiSun size={18} /> : <BiMoon size={18} />}
            </button>
          </div>
        </div>
      </header>
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
            <div
              className='vited-bs-container py-3 vited-bs-content'
              key={pathname}
              ref={attachContent}
            >
              {Content ? (
                <Content components={markdownComponents} />
              ) : (
                <p className='fg-3'>{t('noDocuments')}</p>
              )}
            </div>
            {tocHeadings.length > 0 ? (
              <aside className='vited-bs-toc'>
                <div className='vited-bs-toc-inner'>
                  <div className='small fw-semibold fg-3 mb-2'>{t('tableOfContents')}</div>
                  <TocTree
                    headings={tocHeadings}
                    activeId={activeHeadingId}
                    ariaLabel={t('tableOfContents')}
                  />
                </div>
              </aside>
            ) : undefined}
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
              <button
                type='button'
                className='btn-close'
                aria-label={t('closeNavigation')}
                onClick={() => setMobileOpened(false)}
              />
            </div>
            <nav aria-label={t('navigation')}>
              <ul className='nav flex-column vited-bs-nav gap-1'>{navigation}</ul>
            </nav>
          </aside>
        </div>
      ) : undefined}
      {tocHeadings.length > 0 ? (
        <>
          <button
            type='button'
            className='btn btn-primary rounded-circle shadow vited-bs-toc-toggle'
            aria-label={tocOpened ? t('closeTableOfContents') : t('openTableOfContents')}
            aria-expanded={tocOpened}
            onClick={() => setTocOpened((opened) => !opened)}
          >
            {tocOpened ? <BiX size={22} /> : <BiListUl size={22} />}
          </button>
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
                  <button
                    type='button'
                    className='btn-close'
                    aria-label={t('closeTableOfContents')}
                    onClick={() => setTocOpened(false)}
                  />
                </div>
                <TocTree
                  headings={tocHeadings}
                  activeId={activeHeadingId}
                  ariaLabel={t('tableOfContents')}
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

interface TocTreeProps {
  headings: TocHeading[];
  activeId?: string;
  ariaLabel: string;
  onNavigate?: () => void;
  nested?: boolean;
}

function TocTree({
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

interface LocaleSelectProps {
  locale: string;
  locales: string[];
  onChange: (locale: string) => void;
}

/** Bootstrap-themed locale picker; Bootstrap 6 has no styled select component. */
function LocaleSelect({ locale, locales, onChange }: LocaleSelectProps): ReactElement {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
      <button
        type='button'
        className='btn btn-outline theme-secondary d-flex align-items-center gap-2'
        aria-label={t('language')}
        aria-expanded={opened}
        aria-haspopup='menu'
        onClick={() => setOpened((value) => !value)}
      >
        <BiGlobe2 size={16} />
        {new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale}
        <BiChevronDown size={14} />
      </button>
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

interface SearchModalProps {
  search: (query: string) => SearchDocument[];
  onNavigate: (pathname: string) => void;
  onClose: () => void;
}

function SearchModal({ search, onNavigate, onClose }: SearchModalProps): ReactElement {
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
          <button
            type='button'
            className='btn-close flex-shrink-0'
            aria-label={t('close')}
            onClick={onClose}
          />
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

interface PageNavigationNode {
  key: string;
  title: string;
  page?: VitedPage;
  children: PageNavigationNode[];
}

interface NavigationProps {
  locale?: string;
  activePath?: string;
  onNavigate: () => void;
}

function PageNavigation({
  pages,
  activePath,
  onNavigate,
}: NavigationProps & { pages: VitedPage[] }): ReactElement {
  const nodes: PageNavigationNode[] = [];

  for (const page of pages) {
    let level = nodes;
    const segments = page.path
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
    if (segments.length === 0) {
      level.push({ key: `${page.locale}:${page.path}`, title: page.title, page, children: [] });
      continue;
    }

    let route = '';
    for (const segment of segments) {
      route += `/${encodeURIComponent(segment)}`;
      let node = level.find((item) => item.key === route);
      if (!node) {
        node = { key: route, title: humanize(segment), children: [] };
        level.push(node);
      }
      level = node.children;
      if (route === page.path) {
        node.title = page.title;
        node.page = page;
      }
    }
  }

  return <>{renderPageNavigationNodes(nodes, { activePath, onNavigate })}</>;
}

function renderPageNavigationNodes(nodes: PageNavigationNode[], props: NavigationProps): ReactNode {
  return nodes.map((node) => (
    <NavTreeItem
      key={node.key}
      label={node.title}
      active={node.page?.path === props.activePath}
      defaultOpened={node.children.some(
        (child) =>
          child.page?.path === props.activePath || props.activePath?.startsWith(`${child.key}/`),
      )}
      to={node.page?.pathname}
      onNavigate={props.onNavigate}
    >
      {node.children.length > 0 ? renderPageNavigationNodes(node.children, props) : undefined}
    </NavTreeItem>
  ));
}

function MenuItems({
  entries,
  locale,
  activePath,
  onNavigate,
}: NavigationProps & { entries: VitedMenuEntry[] }): ReactElement {
  return (
    <>
      {entries.map((entry, index) => {
        if (entry.divider) {
          return (
            <li key={`divider-${index}`} aria-hidden='true'>
              <hr className='my-2' />
            </li>
          );
        }
        const href = entry.path ? (entry.pathnames?.[locale ?? ''] ?? '#') : (entry.link ?? '#');
        const label = entry.text ?? entry.file ?? entry.path ?? entry.link ?? '';
        return (
          <NavTreeItem
            key={`${href}:${index}`}
            label={label}
            active={entry.path === activePath}
            defaultOpened={Boolean(entry.children?.length)}
            to={entry.path ? href : undefined}
            href={entry.path ? undefined : href}
            onNavigate={onNavigate}
          >
            {entry.children?.length ? (
              <MenuItems
                entries={entry.children}
                locale={locale}
                activePath={activePath}
                onNavigate={onNavigate}
              />
            ) : undefined}
          </NavTreeItem>
        );
      })}
    </>
  );
}

interface NavTreeItemProps {
  label: string;
  active?: boolean;
  defaultOpened?: boolean;
  /** Internal route rendered with the client router. */
  to?: string;
  /** External link rendered as a plain anchor. */
  href?: string;
  onNavigate: () => void;
  children?: ReactNode;
}

function NavTreeItem({
  label,
  active = false,
  defaultOpened = false,
  to,
  href,
  onNavigate,
  children,
}: NavTreeItemProps): ReactElement {
  const [opened, setOpened] = useState(defaultOpened);
  const hasChildren = Children.count(children) > 0;
  const className = `nav-link d-flex align-items-center gap-1 w-100 text-start${active ? ' active' : ''}`;
  const toggle = hasChildren ? () => setOpened((value) => !value) : undefined;
  const content = (
    <>
      <span className='flex-grow-1'>{label}</span>
      {hasChildren ? (
        <BiChevronDown
          className={`flex-shrink-0 vited-bs-chevron${opened ? '' : ' vited-bs-chevron-closed'}`}
          aria-hidden='true'
        />
      ) : undefined}
    </>
  );

  let control: ReactElement;
  if (to) {
    control = (
      <Link
        to={to}
        asChild
        onClick={() => {
          toggle?.();
          onNavigate();
        }}
      >
        <a className={className} href={to}>
          {content}
        </a>
      </Link>
    );
  } else if (href) {
    control = (
      <a
        className={className}
        href={href}
        onClick={() => {
          toggle?.();
          onNavigate();
        }}
      >
        {content}
      </a>
    );
  } else {
    control = (
      <button type='button' className={className} aria-expanded={opened} onClick={toggle}>
        {content}
      </button>
    );
  }

  return (
    <li className='nav-item'>
      {control}
      {hasChildren && opened ? (
        <ul className='nav flex-column vited-bs-nav gap-1 ms-3 mt-1 border-start ps-1'>
          {children}
        </ul>
      ) : undefined}
    </li>
  );
}

function getSearchShortcut(): string {
  return globalThis.navigator !== undefined &&
    /Mac|iPhone|iPad|iPod/.test(globalThis.navigator.platform)
    ? '⌘K'
    : 'Ctrl+K';
}

function humanize(value: string): string {
  return decodeURIComponent(value).replaceAll(/[-_]/g, ' ');
}

function MarkdownHtml({ html = '' }: MarkdownElementProps): ReactElement {
  return <>{parse(html, { replace: replaceMarkdownHtmlNode })}</>;
}

function replaceMarkdownHtmlNode(node: DOMNode) {
  if (!(node instanceof HtmlElement) || node.name !== 'pre') return;
  const codeNode = node.children.find(
    (child): child is HtmlElement => child instanceof HtmlElement && child.name === 'code',
  );
  if (!codeNode) return;
  const code = codeNode.children.map(getHtmlText).join('');
  return (
    <MarkdownCodeBlock>
      <code className={codeNode.attribs.class}>{code}</code>
    </MarkdownCodeBlock>
  );
}

function MarkdownCodeBlock({ children }: MarkdownElementProps): ReactElement {
  const codeElement = Children.toArray(children).find(
    (child): child is ReactElement<{ className?: string; children?: ReactNode }> =>
      isValidElement(child) && child.type === 'code',
  );
  if (!codeElement) return <pre>{children}</pre>;

  const language = codeElement.props.className?.match(/(?:^|\s)language-([\w+#.-]+)/)?.[1];
  return <CodeBlock code={getReactText(codeElement.props.children)} language={language} />;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps): ReactElement {
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const normalized = language?.toLowerCase();
        const lang = (
          normalized && highlighter.getLoadedLanguages().includes(normalized) ? normalized : 'text'
        ) as BundledLanguage;
        setHtml(
          highlighter.codeToHtml(code, {
            lang,
            themes: { light: 'github-light', dark: 'github-dark' },
          }),
        );
      })
      .catch(() => {
        // Highlighting is best-effort; the plain code fallback stays visible.
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <div className='vited-bs-code-block position-relative border rounded'>
      <CopyButton code={code} />
      {html ? (
        <div className='vited-bs-code' dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className='mb-0 p-3 vited-bs-code-plain'>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

function CopyButton({ code }: { code: string }): ReactElement {
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

function getHtmlText(node: DOMNode): string {
  if (node.type === 'text') return node.data;
  if (node instanceof HtmlElement) return node.children.map(getHtmlText).join('');
  return '';
}

function getReactText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((child) => getReactText(child)).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getReactText(node.props.children);
  return '';
}
