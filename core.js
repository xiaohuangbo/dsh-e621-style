export function createCore() {
  const IMAGE_LIMIT = 6 * 1024 * 1024;
  const LIBRARY_LIMIT = 24 * 1024 * 1024;
  const DATA_URL_LIMIT = 8 * 1024 * 1024;
  const URL_COUNT_LIMIT = 100;
  const defaults = Object.freeze({
    enabled: true,
    mode: 'pattern',
    customUrl: '',
    urls: Object.freeze([]),
    interval: 0,
    opacity: 0.92,
    dim: 0.2,
    blur: 0,
    fit: 'cover',
    scale: 100,
    position: 'center',
    classic: true,
    randomOnLoad: true,
    locale: 'auto',
  });

  function validateImageUrl(value) {
    if (typeof value !== 'string') throw new Error('Image URL must be a string.');
    if (/[\u0000-\u001f\u007f-\u009f]/u.test(value)) {
      throw new Error('Image URL must not contain control characters.');
    }
    const text = value.trim();
    if (!text) throw new Error('Image URL must not be empty.');
    if (/^data:/i.test(text)) {
      if (text.length > DATA_URL_LIMIT) throw new Error('Data image URL exceeds the 8 MiB string limit.');
      const match = /^data:image\/(png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(text);
      if (!match || !match[2]) {
        throw new Error('Use a base64 PNG, JPEG, WebP, GIF, or AVIF data image.');
      }
      const payload = match[2];
      const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
      const unpaddedLength = payload.length - padding;
      if (unpaddedLength % 4 === 1 || (padding > 0 && payload.length % 4 !== 0)) {
        throw new Error('Data image contains invalid base64.');
      }
      if (Math.floor(unpaddedLength * 3 / 4) > IMAGE_LIMIT) {
        throw new Error('Image exceeds the 6 MiB file size limit.');
      }
      return `data:image/${match[1].toLowerCase()};base64,${payload}`;
    }
    let url;
    try {
      url = new URL(text);
    } catch {
      throw new Error('Image URL must be an absolute HTTP or HTTPS URL.');
    }
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !url.hostname) {
      throw new Error('Only HTTP, HTTPS, and supported data image URLs are allowed.');
    }
    return url.href;
  }

  function read(object, key) {
    try {
      return object[key];
    } catch {
      return undefined;
    }
  }

  function numberInRange(value, fallback, min, max) {
    const number = typeof value === 'number' ? value
      : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function normalizedLibrary(value) {
    const result = [];
    const seen = new Set();
    let total = 0;
    try {
      if (!Array.isArray(value)) return result;
      // Own numeric keys avoid traversing billions of holes in malformed sparse arrays.
      for (const key of Object.keys(value)) {
        if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length) continue;
        let url;
        try {
          url = validateImageUrl(read(value, key));
        } catch {
          continue;
        }
        if (seen.has(url)) continue;
        if (total + url.length > LIBRARY_LIMIT) continue;
        result.push(url);
        seen.add(url);
        total += url.length;
        if (result.length === URL_COUNT_LIMIT) break;
      }
    } catch {
      // A revoked Proxy or throwing accessor must not prevent loading safe settings.
    }
    return result;
  }

  function normalizeSettings(input) {
    const source = input !== null && typeof input === 'object' ? input : {};
    const result = { ...defaults, urls: [] };
    for (const key of ['enabled', 'classic', 'randomOnLoad']) {
      const value = read(source, key);
      if (typeof value === 'boolean') result[key] = value;
    }
    for (const [key, allowed] of [
      ['mode', ['pattern', 'none', 'custom', 'random']],
      ['fit', ['cover', 'contain', 'auto']],
      ['position', ['center', 'top', 'bottom', 'left', 'right']],
      ['locale', ['auto', 'zh', 'en']],
    ]) {
      const value = read(source, key);
      if (allowed.includes(value)) result[key] = value;
    }
    try {
      result.customUrl = validateImageUrl(read(source, 'customUrl'));
    } catch {
      result.customUrl = '';
    }
    result.urls = normalizedLibrary(read(source, 'urls'));
    const interval = numberInRange(read(source, 'interval'), defaults.interval, 0, 86400);
    result.interval = interval === 0 ? 0 : Math.max(15, Math.trunc(interval));
    result.opacity = numberInRange(read(source, 'opacity'), defaults.opacity, 0.35, 1);
    result.dim = numberInRange(read(source, 'dim'), defaults.dim, 0, 0.85);
    result.blur = numberInRange(read(source, 'blur'), defaults.blur, 0, 20);
    result.scale = Math.round(numberInRange(read(source, 'scale'), defaults.scale, 25, 300));
    return result;
  }

  function parseUrls(text) {
    if (typeof text !== 'string') throw new Error('URL list must be a string.');
    const result = [];
    const seen = new Set();
    let total = 0;
    const lines = text.split(/\r\n|\n|\r/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].trim()) continue;
      let url;
      try {
        url = validateImageUrl(lines[index]);
      } catch (error) {
        throw new Error(`Invalid image URL on line ${index + 1}: ${error.message}`);
      }
      if (seen.has(url)) continue;
      if (result.length === URL_COUNT_LIMIT) throw new Error('URL library is limited to 100 unique URLs.');
      if (total + url.length > LIBRARY_LIMIT) throw new Error('URL library exceeds the 24 MiB character limit.');
      result.push(url);
      seen.add(url);
      total += url.length;
    }
    return result;
  }

  function chooseRandom(items, current, random = Math.random) {
    if (!Array.isArray(items) || items.length === 0) return '';
    const unique = [...new Set(items.filter(item => typeof item === 'string' && item !== ''))];
    if (unique.length === 0) return '';
    const alternatives = unique.filter(item => item !== current);
    const candidates = alternatives.length ? alternatives : unique;
    if (candidates.length === 1) return candidates[0];
    let sample;
    try {
      sample = random();
    } catch {
      sample = 0;
    }
    if (typeof sample !== 'number' || !Number.isFinite(sample)) sample = 0;
    const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(sample * candidates.length)));
    return candidates[index];
  }

  function cssUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return 'none';
    const safe = value.replace(/[<>"'\\\u0000-\u001f\u007f-\u009f\u2028\u2029]/gu, character => {
      if (character === "'") return '%27';
      return encodeURIComponent(character);
    });
    return `url("${safe}")`;
  }

  return { defaults, normalizeSettings, validateImageUrl, chooseRandom, parseUrls, cssUrl, IMAGE_LIMIT, LIBRARY_LIMIT };
}
