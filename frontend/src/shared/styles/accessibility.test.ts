import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readStyle = (fileName: string) =>
  readFileSync(resolve(process.cwd(), 'src/shared/styles', fileName), 'utf8').replace(/\r\n/g, '\n');

describe('global accessibility style contracts', () => {
  it('bundles Inter Variable from a local package', () => {
    expect(readStyle('globals.css')).toContain(
      "@import '@fontsource-variable/inter/wght.css';",
    );
  });

  it('gives controls and navigation affordances a 44 by 44 pixel target', () => {
    const styles = readStyle('globals.css');
    const targetRule = styles.slice(
      styles.indexOf(':where(\n  button,'),
      styles.indexOf('\n}\n\n:where(', styles.indexOf(':where(\n  button,')),
    );

    expect(styles).toContain('--touch-target-min');
    expect(targetRule).toContain('min-inline-size: var(--touch-target-min);');
    expect(targetRule).toContain('min-block-size: var(--touch-target-min);');
    expect(targetRule).toContain('nav a[href]');
    expect(targetRule).toContain('[data-navigation-link]');
    expect(targetRule).toContain('[data-icon-button]');
    expect(targetRule).not.toMatch(/^ {2}a\[href\],$/m);
  });
});
