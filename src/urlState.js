// Shareable view state kept in the URL hash, for example
// #from=1850&to=1950&item=scientist:maxwell&hide=publications,conferences&scale=density&tapestry=1
//
// scale and tapestry are null when absent, so a bare URL can fall back to the
// reader's saved preferences.

export const LAYER_NAMES = ['people', 'publications', 'discoveries', 'conferences', 'context'];

export function parseHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const from = Number(params.get('from'));
  const to = Number(params.get('to'));
  const hidden = (params.get('hide') || '').split(',').filter((name) => LAYER_NAMES.includes(name));
  const item = params.get('item') || null;
  return {
    from: Number.isFinite(from) && params.has('from') ? from : null,
    to: Number.isFinite(to) && params.has('to') ? to : null,
    item: item && /^(scientist|publication|discovery|conference|event):[\w:-]+$/.test(item) ? item : null,
    hidden,
    trail: /^[\w-]+$/.test(params.get('trail') || '') ? params.get('trail') : null,
    stop: /^[\w-]+$/.test(params.get('stop') || '') ? params.get('stop') : null,
    explain: params.get('explain') === '1',
    scale: ['density', 'linear'].includes(params.get('scale')) ? params.get('scale') : null,
    tapestry: params.has('tapestry') ? params.get('tapestry') === '1' : null
  };
}

export function formatHash({ from, to, item, hidden = [], scale = null, tapestry = null, trail = null, stop = null, explain = false }) {
  const params = new URLSearchParams();
  if (Number.isFinite(from) && Number.isFinite(to)) {
    params.set('from', String(Math.round(from)));
    params.set('to', String(Math.round(to)));
  }
  if (item) params.set('item', item);
  if (trail) {
    params.set('trail', trail);
    if (stop) params.set('stop', stop);
    if (explain) params.set('explain', '1');
  }
  if (hidden.length) params.set('hide', hidden.join(','));
  // Display modes are recorded explicitly, so a shared link opens the way
  // the sender saw it rather than with the recipient's preferences.
  if (scale) params.set('scale', scale);
  if (tapestry !== null) params.set('tapestry', tapestry ? '1' : '0');
  // Keep separators readable in shared links.
  const text = params.toString().replace(/%2C/g, ',').replace(/%3A/g, ':');
  return text ? `#${text}` : '';
}
