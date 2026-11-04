import { Children, useState, type ReactElement, type ReactNode } from 'react';
import { BiChevronDown } from 'react-bootstrap-icons-pro';
import { Link } from 'wouter';

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

export function NavTreeItem({
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
