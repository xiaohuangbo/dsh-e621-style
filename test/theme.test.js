import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeTokens } from '../theme.js';
import { SYNTAX_COLORS, CONTROL_COLORS, STYLE } from '../styles.js';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test('every syntax color, including comments, is readable against the e621 code surface', () => {
  const background = createThemeTokens()['--dsw-alias-markdown-code-block'];
  for (const [name, color] of Object.entries(SYNTAX_COLORS)) {
    assert.ok(contrast(color, background) >= 4.5, `${name}: contrast ${contrast(color, background).toFixed(2)}`);
  }
});

test('secondary and caption text remain readable across the base e621 panels', () => {
  const tokens = createThemeTokens();
  for (const name of ['primary', 'primary-dimmed', 'secondary', 'tertiary', 'caption']) {
    for (const background of ['#020f23', '#152f56', '#1f3c67']) {
      assert.ok(contrast(tokens[`--dsw-alias-label-${name}`], background) >= 4.5, `${name} on ${background}`);
    }
  }
});

test('both switch positions remain distinguishable from the track', () => {
  for (const state of ['active', 'inactive']) {
    assert.ok(contrast(CONTROL_COLORS[state], CONTROL_COLORS.track) >= 3, `${state} thumb contrast`);
  }
  assert.ok(contrast(CONTROL_COLORS.selectedText, CONTROL_COLORS.active) >= 4.5, 'selected button label contrast');
});

test('syntax styles remain scoped to the active theme and preserve token-level highlighting', () => {
  assert.match(STYLE, /body\[data-ds-dark-theme\]:has\(\[data-e621-active\]\)/);
  for (const name of Object.keys(SYNTAX_COLORS)) assert.ok(STYLE.includes(`${name}:`));
  assert.doesNotMatch(STYLE, /(?:pre|code)\s+\*\s*\{[^}]*color\s*:/);
  assert.doesNotMatch(STYLE, /span[^{}]*\{[^}]*color\s*:[^}]*!important/);
});
