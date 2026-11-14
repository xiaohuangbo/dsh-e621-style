// Palette mapped from e621ng's default hexagon theme. See THIRD_PARTY_NOTICES.md.
export function createThemeTokens(opacity = 1, hasImage = false) {
  const alpha = hasImage ? Math.max(0.35, Math.min(1, opacity)) : 1;
  const surface = (r, g, b, a = alpha) => `rgba(${r}, ${g}, ${b}, ${a})`;
  const t = {};
  const put = (names, value) => names.split(' ').forEach(name => { t[`--dsw-${name}`] = value; });
  put('alias-bg-base', hasImage ? 'transparent' : '#020f23');
  put('alias-bg-layer-1', surface(21, 47, 86));
  put('alias-bg-layer-2 alias-bg-module-platform', surface(31, 60, 103));
  put('alias-bg-layer-3', '#2b538e');
  put('alias-bg-overlay specific-menu specific-selector alias-menu-group-header-fill alias-toast-bg alias-tooltip-bg', '#152f56');
  put('specific-sidebar-fill', surface(2, 15, 35));
  put('specific-bubble specific-bubble-highlight', surface(31, 60, 103));
  put('specific-input-major specific-login-input', surface(21, 47, 86));
  put('alias-label-primary alias-label-primary-foreground alias-label-primary-bluish alias-toast-label', '#ffffff');
  // Use blue-white hierarchy instead of neutral gray on the navy surfaces.
  put('alias-label-primary-dimmed alias-label-dimmed', '#deebf7');
  put('alias-label-secondary alias-menu-icon', '#c8dced');
  put('alias-label-tertiary alias-state-idle-primary', '#adc7df');
  put('alias-label-caption', '#9bb8d2');
  put('alias-label-primary-inverted alias-brand-primary-invert', '#020f23');
  put('alias-brand-primary alias-brand-text alias-state-business-primary alias-link alias-markdown-citation', '#b4c7d9');
  put('alias-state-business-tertiary alias-interactive-bg-active specific-sidebar-nav-item-active', '#1f3c67');
  put('specific-sidebar-nav-item-active-accent', '#e8c446');
  put('alias-border-l1 alias-border-l2 alias-settings-card-stroke', '#29466c');
  put('alias-border-l3 alias-border-l4 alias-border-l2-darkmode-thin', '#38619a');
  put('alias-interactive-bg-hover alias-interactive-bg-hover-solid alias-interactive-bg-hover-accent', '#25477b');
  put('alias-button-primary-fill alias-button-primary-hover', '#e8c446');
  put('alias-button-primary-dimmed', '#998335');
  put('alias-button-elevated-fill alias-button-floating-fill alias-button-info-fill alias-button-tool-bar-fill', '#25477b');
  put('alias-button-floating-hover alias-button-info-hover alias-button-tool-bar-hover', '#2b538e');
  put('alias-button-ghost-active-fill alias-button-ghost-active-hover', '#1f3c67');
  put('alias-button-ghost-active-border', '#e8c446');
  put('alias-button-contrast-fill alias-switch-thumb', '#ffffff');
  // e621 DText uses section-lighten-5 for code and a warm gold left rule.
  put('alias-markdown-code-block', '#25477b');
  put('alias-markdown-code-block-banner', '#1f3c67');
  put('alias-markdown-inline-code', 'rgba(255, 255, 255, 0.15)');
  put('alias-markdown-tag alias-markdown-placeholder', '#b4c7d9');
  put('alias-scrollbar-bg-l1 alias-scrollbar-bg-l2', '#29466c');
  put('alias-scrollbar-hover-l1 alias-scrollbar-hover-l2', '#b4c7d9');
  put('alias-state-error-primary', '#e45f5f');
  put('alias-state-error-secondary alias-interactive-bg-hover-danger', '#76312e');
  put('alias-state-success-primary', '#4caf50');
  put('alias-state-success-secondary alias-state-success-tertiary', '#227d2a');
  put('alias-state-warn-primary alias-state-warn-label', '#ffd666');
  put('alias-state-warn-secondary alias-state-warn-tertiary', '#827428');
  put('alias-state-done-primary', '#f2ac08');
  put('alias-label-deep-diving alias-label-deep-diving-shimmer', '#e8c446');
  put('alias-turn-trigger-bg', '#152f56');
  put('alias-turn-trigger-bg-hover', '#1f3c67');
  put('alias-settings-card-fill', surface(31, 60, 103));
  return t;
}

// Original geometric artwork, recreated for this plugin; no e621 logos or mascot art.
export function createPattern() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="168" height="194" viewBox="0 0 168 194"><rect width="168" height="194" fill="#020f23"/><g fill="none" stroke="#102543" stroke-width="2"><path d="M42 1 84 25v48L42 97 0 73V25ZM126 1l42 24v48l-42 24-42-24V25ZM0 73l42 24v48L0 169l-42-24V97ZM84 73l42 24v48l-42 24-42-24V97ZM168 73l42 24v48l-42 24-42-24V97ZM42 145l42 24v48l-42 24L0 217v-48ZM126 145l42 24v48l-42 24-42-24v-48Z"/></g></svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
