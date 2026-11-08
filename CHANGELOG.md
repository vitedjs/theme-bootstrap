# Changelog

## Unreleased

## 0.1.6 - 2026-11-07

### Changed

- Update react-bootstrap-pro to 0.4.0

## 0.1.5 - 2026-11-06

### Added

- Use Wouter client-side navigation for links between documentation pages.

## 0.1.4 - 2026-11-05

### Added

- Show green `new` and orange `deprecated` badges from page frontmatter in the generated sidebar.

## 0.1.3 - 2026-11-03

### Fixed

- Display nested sidebar entries below their parent instead of beside it.

## 0.1.2 - 2026-11-02

### Added

- Show an anchor link when hovering a Markdown or MDX heading, and list the page outline in a table of contents that stays in view while scrolling. On small screens the outline opens from a floating button.

### Changed

- On small screens, show the search and language controls as icon buttons and move the GitHub and Donate links into the navigation drawer, so the header title keeps its space. Icon-only buttons keep the same square size on every screen.
- Use 20px icons for the header toolbar buttons.
- Match the table of contents column width to the navigation sidebar, keeping the article centered on wide screens.

## 0.1.0

Initial release.

### Added

- Responsive documentation layout with a sticky header, collapsible sidebar navigation, and a mobile offcanvas drawer.
- English and Simplified Chinese interface translations, localized routes, and a persisted light/dark theme toggle based on Bootstrap color modes.
- Locale-aware fuzzy search in a modal dialog with the `Ctrl+K` / `⌘K` shortcut and keyboard navigation.
- Optional GitHub and Donate links from project metadata.
- Markdown and MDX code blocks highlighted with Shiki, including copy controls.
