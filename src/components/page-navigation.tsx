import type { ReactElement, ReactNode } from 'react';

import type { VitedPage } from '../types';
import { NavTreeItem } from './nav-tree-item';
import type { NavigationProps } from './navigation-types';

interface PageNavigationNode {
  key: string;
  title: string;
  page?: VitedPage;
  children: PageNavigationNode[];
}

export function PageNavigation({
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

function humanize(value: string): string {
  return decodeURIComponent(value).replaceAll(/[-_]/g, ' ');
}
