import test from 'node:test';
import assert from 'node:assert/strict';
import { createCore } from '../core.js';

const core = createCore();
const { defaults, normalizeSettings, validateImageUrl, chooseRandom, parseUrls, cssUrl, IMAGE_LIMIT, LIBRARY_LIMIT } = core;

const expectedDefaults = {
  enabled: true, mode: 'pattern', customUrl: '', urls: [], interval: 0,
  opacity: 0.92, dim: 0.2, blur: 0, fit: 'cover', scale: 100, position: 'center',
  classic: true, randomOnLoad: true, locale: 'auto',
};

test('createCore exposes the exact self-contained interface and defaults', () => {
  assert.deepEqual(Object.keys(core).sort(), [
    'defaults', 'normalizeSettings', 'validateImageUrl', 'chooseRandom',
    'parseUrls', 'cssUrl', 'IMAGE_LIMIT', 'LIBRARY_LIMIT',
  ].sort());
  assert.deepEqual(defaults, expectedDefaults);
  assert.equal(IMAGE_LIMIT, 6 * 1024 * 1024);
  assert.equal(LIBRARY_LIMIT, 24 * 1024 * 1024);
  const recreated = Function(`return (${createCore.toString()})()`)();
  assert.deepEqual(recreated.normalizeSettings(), expectedDefaults);
});

test('HTTP(S) URLs are canonicalized without damaging query strings', () => {
  assert.equal(validateImageUrl('  HTTPS://EXAMPLE.COM:443/a b.png?x=1&y=2#image  '),
    'https://example.com/a%20b.png?x=1&y=2#image');
  assert.equal(validateImageUrl('http://example.com'), 'http://example.com/');
});

test('only supported base64 raster data images are accepted', () => {
  for (const type of ['png', 'jpeg', 'webp', 'gif', 'avif']) {
    assert.equal(validateImageUrl(`data:image/${type};base64,AA==`), `data:image/${type};base64,AA==`);
  }
  assert.equal(validateImageUrl('DATA:IMAGE/PNG;BASE64,AA=='), 'data:image/png;base64,AA==');
  assert.equal(validateImageUrl('data:image/png;base64,AAA'), 'data:image/png;base64,AAA');
  for (const value of [
    'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/svg+xml,<svg/>',
    'data:text/html;base64,AAAA', 'data:image/jpg;base64,AAAA',
    'data:image/png,AAAA', 'data:image/png;charset=utf-8;base64,AAAA',
    'data:image/png;base64,', 'data:image/png;base64,A',
    'data:image/png;base64,A===', 'data:image/png;base64,AA=',
    'data:image/png;base64,AA==AA==', 'data:image/png;base64,AA-_' ,
    'data:image/png;base64,AA ==',
  ]) assert.throws(() => validateImageUrl(value), Error, value);
});

test('unsafe schemes, relative URLs, nonstrings, and all control characters are rejected', () => {
  for (const value of [
    'file:///tmp/image.png', 'javascript:alert(1)', 'blob:https://example.com/123',
    '//example.com/image.png', '/image.png', 'image.png', 'https://',
    '', '   ', undefined, null, 1, {}, [], new String('https://example.com/'),
  ]) assert.throws(() => validateImageUrl(value), Error);
  for (let code = 0; code <= 0x9f; code += 1) {
    if (code > 0x1f && code < 0x7f) continue;
    assert.throws(() => validateImageUrl(`https://example.com/a${String.fromCharCode(code)}.png`), /control/);
  }
  assert.throws(() => validateImageUrl('\nhttps://example.com/a.png'), /control/);
});

test('the complete data URL may reach 8 MiB but must not exceed it', () => {
  const prefix = 'data:image/png;base64,';
  const atLimit = prefix + 'A'.repeat(8 * 1024 * 1024 - prefix.length);
  assert.equal(atLimit.length, 8 * 1024 * 1024);
  assert.equal(validateImageUrl(atLimit), atLimit);
  assert.throws(() => validateImageUrl(atLimit + 'A'), /8 MiB/);
  assert.throws(() => validateImageUrl(prefix + 'A'.repeat(IMAGE_LIMIT * 4 / 3 + 4)), /8 MiB|6 MiB/);
});

test('normalization always returns fresh plain settings with only known keys', () => {
  for (const input of [undefined, null, false, true, 4, 'bad', [], () => {}, Symbol('x')]) {
    const result = normalizeSettings(input);
    assert.deepEqual(result, expectedDefaults);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
  }
  const input = JSON.parse('{"__proto__":{"polluted":true},"extra":"ignored","urls":[]}');
  const result = normalizeSettings(input);
  assert.deepEqual(result, expectedDefaults);
  assert.equal(Object.prototype.polluted, undefined);
  assert.notEqual(result.urls, input.urls);
  assert.notEqual(result.urls, defaults.urls);
  result.urls.push('https://example.com/');
  assert.deepEqual(normalizeSettings().urls, []);
});

test('normalization tolerates throwing accessors and revoked proxies', () => {
  const source = Object.create(null);
  Object.defineProperty(source, 'opacity', { get() { throw new Error('bad accessor'); } });
  source.urls = new Proxy([], { ownKeys() { throw new Error('bad keys'); } });
  assert.deepEqual(normalizeSettings(source), expectedDefaults);
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  assert.deepEqual(normalizeSettings(proxy), expectedDefaults);
  const sparse = [];
  sparse[4294967294] = 'https://example.com/a.png';
  assert.deepEqual(normalizeSettings({ urls: sparse }).urls, ['https://example.com/a.png']);
});

test('normalization preserves valid choices and rejects malformed enums and booleans', () => {
  for (const mode of ['pattern', 'none', 'custom', 'random']) assert.equal(normalizeSettings({ mode }).mode, mode);
  for (const fit of ['cover', 'contain', 'auto']) assert.equal(normalizeSettings({ fit }).fit, fit);
  for (const position of ['center', 'top', 'bottom', 'left', 'right']) {
    assert.equal(normalizeSettings({ position }).position, position);
  }
  assert.deepEqual(normalizeSettings({
    enabled: 'false', classic: 0, randomOnLoad: null, mode: '__proto__', fit: 'stretch', position: 'bad',
  }), expectedDefaults);
  const result = normalizeSettings({ enabled: false, classic: false, randomOnLoad: false });
  assert.equal(result.enabled, false);
  assert.equal(result.classic, false);
  assert.equal(result.randomOnLoad, false);
});

test('normalization clamps numeric boundaries and sanitizes nonfinite numbers', () => {
  const low = normalizeSettings({ interval: -1, opacity: 0, dim: -1, blur: -1 });
  assert.deepEqual([low.interval, low.opacity, low.dim, low.blur], [0, 0.35, 0, 0]);
  const high = normalizeSettings({ interval: 90000, opacity: 2, dim: 1, blur: 30 });
  assert.deepEqual([high.interval, high.opacity, high.dim, high.blur], [86400, 1, 0.85, 20]);
  for (const [input, expected] of [[0, 0], [0.1, 15], [14, 15], [15, 15], [15.9, 15], [86400, 86400]]) {
    assert.equal(normalizeSettings({ interval: input }).interval, expected);
  }
  const exact = normalizeSettings({ opacity: 0.35, dim: 0.85, blur: 20, interval: '30' });
  assert.deepEqual([exact.opacity, exact.dim, exact.blur, exact.interval], [0.35, 0.85, 20, 30]);
  assert.equal(normalizeSettings({ opacity: '0.6' }).opacity, 0.6);
  for (const bad of [NaN, Infinity, -Infinity, null, '', 'bad', false, [], {}, Symbol('x')]) {
    const result = normalizeSettings({ interval: bad, opacity: bad, dim: bad, blur: bad });
    assert.deepEqual([result.interval, result.opacity, result.dim, result.blur], [0, 0.92, 0.2, 0]);
  }
});

test('normalization preserves language choices and clamps image scale', () => {
  for (const locale of ['auto', 'zh', 'en']) assert.equal(normalizeSettings({ locale }).locale, locale);
  assert.equal(normalizeSettings({ locale: 'fr' }).locale, 'auto');
  assert.equal(normalizeSettings({ scale: 1 }).scale, 25);
  assert.equal(normalizeSettings({ scale: 301 }).scale, 300);
  assert.equal(normalizeSettings({ scale: '137.6' }).scale, 138);
  assert.equal(normalizeSettings({ scale: 'bad' }).scale, 100);
});


test('normalization filters invalid URLs, deduplicates canonical URLs, and caps at 100', () => {
  const urls = ['javascript:alert(1)', 'https://EXAMPLE.com:443/a.png', 'https://example.com/a.png', null];
  urls.push(...Array.from({ length: 105 }, (_, index) => `https://example.com/${index}.png`));
  const input = { urls, customUrl: 'HTTPS://EXAMPLE.com:443/custom.png' };
  const result = normalizeSettings(input);
  assert.equal(result.customUrl, 'https://example.com/custom.png');
  assert.equal(result.urls.length, 100);
  assert.equal(result.urls[0], 'https://example.com/a.png');
  assert.equal(result.urls.at(-1), 'https://example.com/98.png');
  assert.equal(urls.length, 109);
  assert.equal(normalizeSettings({ customUrl: 'data:image/svg+xml;base64,AAAA' }).customUrl, '');
});

test('parseUrls accepts multiline input, blank lines, and duplicate canonical URLs', () => {
  assert.deepEqual(parseUrls('  https://EXAMPLE.com/a.png  \r\n\r\nhttps://example.com/a.png\nhttp://example.com/b.png\r'), [
    'https://example.com/a.png', 'http://example.com/b.png',
  ]);
  assert.deepEqual(parseUrls(' \n\r\n'), []);
  assert.throws(() => parseUrls(null), /string/);
  assert.throws(() => parseUrls('https://example.com/a.png\n\njavascript:bad'), /line 3/);
  assert.throws(() => parseUrls('https://example.com/a\u0000.png'), /control/);
  const hundred = Array.from({ length: 100 }, (_, index) => `https://example.com/${index}`);
  assert.equal(parseUrls([...hundred, hundred[0]].join('\n')).length, 100);
  assert.throws(() => parseUrls([...hundred, 'https://example.com/extra'].join('\n')), /100/);
});

test('library character budget is inclusive and normalization drops overflowing entries', () => {
  const prefix = 'https://example.com/';
  const singleLength = LIBRARY_LIMIT / 4;
  const urls = ['a', 'b', 'c', 'd'].map(character => prefix + character.repeat(singleLength - prefix.length));
  assert.equal(urls.reduce((sum, url) => sum + url.length, 0), LIBRARY_LIMIT);
  assert.deepEqual(parseUrls(urls.join('\n')), urls);
  assert.deepEqual(normalizeSettings({ urls }).urls, urls);
  const overflowing = [...urls, 'https://example.com/extra.png'];
  assert.throws(() => parseUrls(overflowing.join('\n')), /24 MiB/);
  assert.deepEqual(normalizeSettings({ urls: overflowing }).urls, urls);
});

test('chooseRandom avoids the current item, deduplicates, and preserves the input', () => {
  assert.equal(chooseRandom([], 'a'), '');
  assert.equal(chooseRandom(null, 'a'), '');
  assert.equal(chooseRandom(['a'], 'a'), 'a');
  assert.equal(chooseRandom(['a', 'a'], 'a'), 'a');
  assert.equal(chooseRandom(['a', 'b'], 'a', () => 0), 'b');
  assert.equal(chooseRandom(['a', 'b'], 'a', () => 1), 'b');
  const items = ['a', 'b', 'a', 'c'];
  assert.equal(chooseRandom(items, 'a', () => 0), 'b');
  assert.equal(chooseRandom(items, 'a', () => 0.999999), 'c');
  assert.equal(chooseRandom(items, 'missing', () => 0.5), 'b');
  assert.deepEqual(items, ['a', 'b', 'a', 'c']);
  let current = 'a';
  for (let index = 0; index < 30; index += 1) {
    const next = chooseRandom(items, current, () => (index % 10) / 10);
    assert.notEqual(next, current);
    current = next;
  }
});

test('chooseRandom bounds unexpected random values without returning undefined', () => {
  for (const sample of [-1, NaN, Infinity, undefined, '0.5']) {
    assert.equal(chooseRandom(['a', 'b'], '', () => sample), 'a');
  }
  assert.equal(chooseRandom(['a', 'b'], '', () => 1), 'b');
  assert.equal(chooseRandom(['a', 'b'], '', () => 10), 'b');
  assert.equal(chooseRandom(['a', 'b'], '', () => { throw new Error('rng'); }), 'a');
});

test('cssUrl emits a quoted URL and encodes HTML, quotes, CSS escapes, and line breaks', () => {
  assert.equal(cssUrl('https://example.com/a.png?x=1&y=2'), 'url("https://example.com/a.png?x=1&y=2")');
  assert.equal(cssUrl(''), 'none');
  assert.equal(cssUrl('   '), 'none');
  assert.equal(cssUrl(null), 'none');
  const attack = '\\");}</style><script>bad()</script>\'\r\n\f\u0000\u2028\u2029';
  const output = cssUrl(attack);
  assert.ok(output.startsWith('url("') && output.endsWith('")'));
  const content = output.slice(5, -2);
  assert.doesNotMatch(content, /[<>"'\\\u0000-\u001f\u007f-\u009f\u2028\u2029]/u);
  for (const encoded of ['%5C', '%22', '%3C', '%3E', '%27', '%0D', '%0A', '%0C', '%00', '%E2%80%A8', '%E2%80%A9']) {
    assert.ok(content.includes(encoded), encoded);
  }
});
