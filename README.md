# @vited/theme-bootstrap

A Bootstrap 6 theme for Vited. It renders generated document pages with a
responsive header and sidebar layout, and includes a persisted light/dark theme
toggle built on Bootstrap's `data-bs-theme` color modes. Icons come from
`react-bootstrap-icons-pro`. Interface labels are available in English and
Simplified Chinese; the language selector appears when multiple locales are
configured. These labels use `react-i18next` resources in
[`src/i18n.ts`](./src/i18n.ts). When supplied with Vited's generated search index, it
provides locale-aware fuzzy search in a modal dialog, opened with the Search
button or `Ctrl+K` / `⌘K`. GitHub and Donate links are shown in the header when
the supplied `packageJSON` includes valid `repository` and `funding` URLs. The
documentation favicon discovered by Vited is displayed to the left of the
header title. Markdown and MDX fenced code blocks are highlighted with Shiki
(github-light/github-dark dual themes), including copy controls with translated
labels. Markdown and MDX headings show an anchor link on hover, and the page outline is shown in a table of contents on the right of the content; on small screens it opens from a floating button.

```ts
import { defineConfig } from '@vited/core';

export default defineConfig({
  docs: {
    title: 'My Cool Library',
    supportedLocales: ['en', 'zh'],
    theme: '@vited/theme-bootstrap',
  },
});
```

The theme is loaded by Vited's generated client; applications don't need to
render it manually. The color scheme follows the system by default and
remembers the user's explicit light/dark selection.
