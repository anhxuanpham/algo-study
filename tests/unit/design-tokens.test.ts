import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const tokensPath = new URL('../../src/styles/tokens.css', import.meta.url);
const globalPath = new URL('../../src/styles/global.css', import.meta.url);
const themeControlPath = new URL(
  '../../src/components/interactive/theme-control.tsx',
  import.meta.url,
);
const learningLayoutPath = new URL('../../src/layouts/learning-layout.astro', import.meta.url);

async function read(path: URL) {
  return readFile(path, 'utf8');
}

describe('design system foundation', () => {
  it('defines required semantic tokens and explicit dark overrides', async () => {
    const css = await read(tokensPath);
    const required = [
      '--canvas:',
      '--surface:',
      '--ink:',
      '--muted:',
      '--border:',
      '--primary:',
      '--action:',
      '--success:',
      '--warning:',
      '--danger:',
      '--focus:',
      "[data-theme='dark']",
    ];

    for (const token of required) {
      expect(css).toContain(token);
    }
  });

  it('keeps visible focus and reduced motion rules', async () => {
    const css = await read(globalPath);
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).not.toContain('outline: none');
  });

  it('does not use CSS gradients in the visual foundation', async () => {
    const [tokens, global] = await Promise.all([read(tokensPath), read(globalPath)]);
    expect(`${tokens}\n${global}`).not.toMatch(/(?:linear|radial|conic)-gradient/i);
  });

  it('keeps interactive styles external for a strict csp path', async () => {
    const componentPaths = [
      themeControlPath,
      new URL('../../src/components/interactive/learning-tabs.tsx', import.meta.url),
      new URL('../../src/components/interactive/foundation-dialog.tsx', import.meta.url),
    ];
    const components = await Promise.all(componentPaths.map(read));

    for (const component of components) {
      expect(component).toMatch(/import ['"].+\.css['"]/);
      expect(component).not.toContain('<style>');
    }
  });

  it('keeps curriculum navigation available below desktop', async () => {
    const layout = await read(learningLayoutPath);
    expect(layout).toContain('learning-shell__curriculum-mobile');
    expect(layout).toContain('<summary>Chương trình học</summary>');
  });
});
