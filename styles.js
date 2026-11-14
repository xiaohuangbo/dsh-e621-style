// Adapted to e621's navy panels, gold code accent and colorful tag palette.
export const SYNTAX_COLORS = Object.freeze({
  '--shiki-foreground': '#ffffff',
  '--shiki-token-constant': '#9fd4ff',
  '--shiki-token-string': '#9ce6b0',
  '--shiki-token-comment': '#b1c7df',
  '--shiki-token-keyword': '#ff91cf',
  '--shiki-token-parameter': '#ffc391',
  '--shiki-token-function': '#ffe380',
  '--shiki-token-string-expression': '#78dca5',
  '--shiki-token-punctuation': '#e0ecf7',
  '--shiki-token-link': '#b4dfff',
});

// Matches e621ng common/_standard_elements.scss: st-toggle and stm-toggle.
export const CONTROL_COLORS = Object.freeze({
  track: '#152f56',
  inactive: '#999999',
  active: '#e8c446',
  selectedText: '#020f23',
});

export const STYLE = `
/* Scope all host overrides to the mounted theme marker. Unload removes the sheet. */
body:has([data-e621-active]) {
  isolation: isolate;
  background: #020f23;
  color-scheme: dark;
  --dsw-radius-xs: 2px;
  --dsw-radius-sm: 4px;
  --dsw-radius-md: 4px;
  --dsw-radius-lg: 4px;
  --dsw-radius-xl: 4px;
  --dsw-radius-panel: 4px;
  --dsw-corner-shape: round;
  --dsw-focus-ring-color: #e8c446;
  --dsw-font-family: Verdana, Geneva, sans-serif;
  --dsw-menu-backdrop-filter: none;
  --dsw-elevation-stroke-color: #29466c;
  --e621-control-track: ${CONTROL_COLORS.track};
  --e621-control-inactive: ${CONTROL_COLORS.inactive};
  --e621-control-active: ${CONTROL_COLORS.active};
  --e621-control-contrast: ${CONTROL_COLORS.selectedText};
}
body:has([data-e621-active])::before {
  content: '';
  position: fixed;
  inset: calc(-1 * var(--e621-blur, 0px));
  z-index: -1;
  pointer-events: none;
  background-color: #020f23;
  background-image: linear-gradient(rgba(2,15,35,var(--e621-dim,0)),rgba(2,15,35,var(--e621-dim,0))),var(--e621-image,none);
  background-size: auto, var(--e621-size,cover);
  background-position: center, var(--e621-position,center);
  background-repeat: no-repeat, var(--e621-repeat,no-repeat);
  filter: blur(var(--e621-blur,0px));
}
body:has([data-e621-active]) a { color: var(--dsw-alias-link); }
body:has([data-e621-active]) a:hover { color: #e9f2fa; }
body:has([data-e621-active]) a:active { color: #e8c446; }
/* Override Shiki's CSS-variable theme, retaining language parsing and token spans. */
body:has([data-e621-active]),
body[data-ds-dark-theme]:has([data-e621-active]) {
  ${Object.entries(SYNTAX_COLORS).map(([name, value]) => `${name}: ${value};`).join('\n  ')}
  --shiki-background: var(--dsw-alias-markdown-code-block);
}
body:has([data-e621-active]) pre {
  color: var(--shiki-foreground);
  background-color: var(--shiki-background);
  border-left: 4px solid var(--shiki-token-function);
  border-radius: 4px;
}
body:has([data-e621-active]) pre code {
  color: var(--shiki-foreground);
  background-color: transparent;
}
body:has([data-e621-active]) :not(pre) > code {
  color: var(--shiki-token-function);
  background-color: var(--dsw-alias-markdown-inline-code);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 4px;
  padding: 0.05em 0.3em;
}
/* Semantic switches have their own geometry; never flatten them with generic buttons. */
body:has([data-e621-active][data-classic]) :is(button:not([role=switch]):not([role=checkbox]):not([role=radio]),input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea) { border-radius: 4px; }
body:has([data-e621-active]) input:is([type=checkbox],[type=radio],[type=range]) { accent-color: var(--e621-control-active); }
body:has([data-e621-active][data-classic]) input:is([type=checkbox],[type=radio]):not(.e621-toggle-input) { color-scheme: light; }
/* Host settings keep their original switch semantics and click/keyboard handlers. */
body:has([data-e621-active]) button[role=switch] {
  appearance: none;
  box-sizing: border-box;
  display: inline-block;
  position: relative;
  width: 2.5rem;
  min-width: 2.5rem;
  max-width: 2.5rem;
  height: 1.5rem;
  min-height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  box-shadow: none;
  vertical-align: middle;
  flex-shrink: 0;
  cursor: pointer;
  overflow: visible;
  font-size: 0;
  line-height: 0;
}
/* Opacity retains accessible text supplied by host children. */
body:has([data-e621-active]) button[role=switch] > * { opacity: 0; }
body:has([data-e621-active]) button[role=switch]::before,
.e621-settings .e621-toggle-track::before {
  content: '';
  position: absolute;
  box-sizing: border-box;
  width: 2.5rem;
  height: 0.75rem;
  left: 0;
  top: 0.375rem;
  background: var(--e621-control-track,var(--dsw-alias-bg-layer-2));
  border-radius: 4px;
  box-shadow: inset 0 0 0.25rem #00000060;
  pointer-events: none;
}
body:has([data-e621-active]) button[role=switch]::after,
.e621-settings .e621-toggle-track::after {
  content: '';
  position: absolute;
  box-sizing: border-box;
  width: 1rem;
  height: 1rem;
  top: 0.25rem;
  left: 0;
  background: var(--e621-control-inactive,var(--dsw-alias-label-tertiary));
  border-radius: 4px;
  transition: left 100ms, background-color 200ms;
  pointer-events: none;
}
body:has([data-e621-active]) button[role=switch][aria-checked=true]::after,
.e621-settings .e621-toggle-input:checked + .e621-toggle-track::after {
  left: 1.5rem;
  background: var(--e621-control-active,var(--dsw-alias-state-business-primary));
}
body:has([data-e621-active]) button[role=switch][aria-checked=mixed]::after {
  left: 0.75rem;
  background: var(--dsw-alias-state-warn-primary);
}
body:has([data-e621-active]) button[role=switch]:is(:disabled,[aria-disabled=true]) { cursor: not-allowed; opacity: 0.5; }
body:has([data-e621-active]) button[role=switch]:focus-visible,
.e621-settings .e621-toggle-input:focus-visible + .e621-toggle-track {
  outline: 2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}
body:has([data-e621-active]) button[aria-pressed=true]:not([role=switch]) {
  color: var(--e621-control-contrast);
  background: var(--e621-control-active);
  border-color: var(--e621-control-active);
}
body:has([data-e621-active][data-classic]) :is(input[type=text],input[type=search],input[type=url],input[type=number],input[type=password],textarea):not(:disabled) {
  background-color: #fff;
  color: #111;
  caret-color: #111;
}
body:has([data-e621-active][data-classic]) :is(input[type=text],input[type=search],input[type=url],input[type=number],input[type=password],textarea):focus {
  background-color: #ffc;
  color: #111;
}
body:has([data-e621-active][data-classic]) :is(input,textarea)::placeholder { color: #666; }
.e621-settings { color: var(--dsw-alias-label-primary); font: 14px/1.5 var(--dsw-font-family); max-width: 880px; padding: 4px 0 28px; }
.e621-settings * { box-sizing: border-box; }
.e621-settings h2 { font-size: 22px; line-height: 1.3; margin: 0 0 6px; }
.e621-settings h3 { font-size: 16px; margin: 0 0 12px; }
.e621-settings p { margin: 6px 0 14px; }
.e621-settings .e621-muted { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.e621-settings .e621-section { border-bottom: 1px solid var(--dsw-alias-border-l2); padding: 20px 0; }
.e621-settings .e621-row { display:flex; gap:16px; align-items:center; justify-content:space-between; margin:12px 0; flex-wrap:wrap; }
.e621-settings .e621-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.e621-settings button,.e621-settings select,.e621-settings input,.e621-settings textarea { font:inherit; }
.e621-settings button { padding:7px 14px; border:1px solid var(--dsw-alias-border-l2); border-radius:4px; color:var(--dsw-alias-label-primary); background:var(--dsw-alias-button-elevated-fill); cursor:pointer; min-height:34px; }
.e621-settings button:hover:not(:disabled) { background:var(--dsw-alias-button-floating-hover); }
.e621-settings button:disabled { opacity:.5; cursor:default; }
.e621-settings button.e621-primary { background:var(--dsw-alias-button-primary-fill); color:var(--dsw-alias-label-primary-inverted); font-weight:600; }
.e621-settings button[aria-pressed=true] { border-color:var(--dsw-alias-brand-primary); box-shadow:inset 0 -2px var(--dsw-alias-brand-primary); }
.e621-settings :is(input[type=text],input[type=url],input[type=number],textarea,select) { border:1px solid var(--dsw-alias-border-l2); border-radius:4px; padding:7px 9px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); max-width:100%; min-height:34px; }
.e621-settings input[type=url],.e621-settings textarea { width:100%; }
.e621-settings textarea { resize:vertical; min-height:100px; }
.e621-settings input[type=number] { width:100px; }
.e621-settings input[type=range] { width:min(220px,50vw); accent-color:var(--dsw-alias-brand-primary); }
.e621-settings .e621-language-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-bottom:16px; margin-bottom:16px; border-bottom:1px solid var(--dsw-alias-border-l2); flex-wrap:wrap; }
.e621-settings .e621-language-label { font-weight:600; color:var(--dsw-alias-label-primary); }
.e621-settings .e621-language-segmented { display:flex; gap:0; }
.e621-settings .e621-language-segmented button { min-height:30px; padding:4px 10px; border-radius:0; background:var(--dsw-alias-bg-layer-2); font-size:12px; }
.e621-settings .e621-language-segmented button:first-child { border-radius:4px 0 0 4px; }
.e621-settings .e621-language-segmented button:last-child { border-radius:0 4px 4px 0; }
.e621-settings .e621-language-segmented button + button { margin-left:-1px; }
.e621-settings .e621-language-segmented button[aria-pressed=true] { position:relative; z-index:1; color:var(--e621-control-contrast); background:var(--e621-control-active); border-color:var(--e621-control-active); box-shadow:none; }
.e621-settings .e621-section > .e621-language-row + .e621-toggle-row { margin-top:0; }
.e621-settings .e621-toggle-row { margin:12px 0; }
.e621-settings label.e621-toggle-control { position:relative; display:inline-flex; gap:10px; min-height:32px; max-width:100%; cursor:pointer; }
.e621-settings input.e621-toggle-input {
  position:absolute;
  width:1px;
  height:1px;
  margin:-1px;
  padding:0;
  border:0;
  overflow:hidden;
  clip-path:inset(50%);
  white-space:nowrap;
}
.e621-settings .e621-toggle-track { display:inline-block; position:relative; width:2.5rem; height:1.5rem; flex:0 0 2.5rem; border-radius:4px; }
.e621-settings .e621-toggle-title { min-width:0; }
.e621-settings .e621-toggle-control:has(input:disabled) { cursor:not-allowed; }
.e621-settings .e621-toggle-input:disabled ~ :is(.e621-toggle-track,.e621-toggle-title) { opacity:0.5; }
.e621-settings .e621-toggle-help { margin:4px 0 0; }
.e621-settings label { display:flex; gap:8px; align-items:center; }
.e621-settings .e621-stack { display:flex; flex-direction:column; align-items:stretch; gap:8px; }
.e621-settings .e621-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-top:14px; }
.e621-settings .e621-tile { min-width:0; padding:6px; border:1px solid var(--dsw-alias-border-l2); border-radius:4px; background:var(--dsw-alias-bg-layer-2); }
.e621-settings .e621-tile img { width:100%; height:80px; object-fit:cover; border-radius:2px; display:block; background:var(--dsw-alias-bg-base); }
.e621-settings .e621-tile .e621-actions { margin-top:6px; gap:4px; }
.e621-settings .e621-tile button { font-size:12px; padding:3px 7px; min-height:28px; flex:1; }
.e621-settings .e621-preview { border:1px solid var(--dsw-alias-border-l2); border-radius:4px; min-height:150px; padding:16px; background-color:var(--dsw-alias-bg-base); background-position:center; background-size:cover; margin:12px 0; overflow:hidden; }
.e621-settings .e621-preview-card { background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); padding:12px; border-radius:4px; max-width:300px; }
.e621-settings .e621-status { white-space:pre-wrap; border-left:3px solid var(--dsw-alias-brand-primary); padding:8px 12px; background:var(--dsw-alias-bg-layer-2); margin:12px 0; }
.e621-settings .e621-error { border-color:var(--dsw-alias-state-error-primary); }
.e621-settings :focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary)); outline-offset:2px; }
.e621-settings .e621-count { font-variant-numeric:tabular-nums; color:var(--dsw-alias-label-secondary); }
@media(max-width:600px) { .e621-settings h2{font-size:19px} .e621-settings .e621-row{gap:8px} .e621-settings .e621-actions{gap:6px} }
@media(prefers-reduced-motion:reduce) {
  .e621-settings * { scroll-behavior:auto; transition:none; }
  body:has([data-e621-active]) button[role=switch]::after,
  .e621-settings .e621-toggle-track::after { transition:none; }
}
`;
