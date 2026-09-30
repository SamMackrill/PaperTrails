import { resolveItem, researchIndex, scientists, trails } from './dataLoader.js?v=pass2-04';
import { RELATION_LABELS } from './researchModel.js?v=pass2-04';
import { yearToX } from './timeScale.js?v=3';
import { element, stopContent } from './trailContent.js?v=pass2-06b';
import { getActiveTrail, getTrailState, layoutTrailLabels, setTrailState, trailRouteRailY } from './trailState.js?v=pass2-06c';

export function setupTrails({ change, openRecord }) {
  const bar = document.getElementById('trail-bar');
  const select = document.getElementById('trail-select');
  const panel = document.getElementById('trail-panel');
  const content = document.getElementById('trail-content');
  const progress = document.getElementById('trail-progress');
  const back = document.getElementById('trail-prev');
  const next = document.getElementById('trail-next');
  const explainButton = document.getElementById('trail-explain');
  const overview = document.getElementById('trail-overview');
  const archive = document.getElementById('trail-clear');
  bar.hidden = !trails.length;
  for (const trail of trails) {
    const option = element('option', trail.title); option.value = trail.id; select.append(option);
  }

  function update() {
    const trail = getActiveTrail(), state = getTrailState();
    const index = trail?.stops.findIndex(stop => stop.id === state.stop) ?? -1;
    select.value = state.trail || '';
    back.disabled = !trail || index <= 0;
    next.disabled = !trail || index >= trail.stops.length - 1;
    const printLink = document.getElementById('trail-print');
    [explainButton, overview, archive, printLink].forEach(button => { button.hidden = !trail; });
    printLink.href = trail ? `print-trail.html?trail=${encodeURIComponent(trail.id)}` : './';
    progress.textContent = trail ? `${index + 1} / ${trail.stops.length}` : 'Choose an idea trail';
    panel.hidden = !state.explain;
    explainButton.setAttribute('aria-expanded', String(state.explain));
    document.body.classList.toggle('has-trail-panel', state.explain);
    document.body.classList.toggle('has-active-trail', Boolean(trail));
    content.replaceChildren();
    if (!trail) return;
    const stop = trail.stops[index], record = resolveItem(stop.item);
    const author = scientists[record.scientistId]?.name || record.item.discoverer || '';
    const relation = researchIndex.relationById.get(stop.relation);
    content.append(element('p', trail.question, 'trail-question'), element('p', `STOP ${index + 1} · ${record.item.year} · ${author}`, 'trail-kicker'));
    content.append(element('h2', record.item.title));
    content.append(stopContent(stop, record, relation, RELATION_LABELS[relation?.kind]));
    const open = element('button', 'Open the timeline record', 'text-button'); open.type = 'button';
    open.addEventListener('click', () => { setTrailState(trail, stop.id, false); update(); openRecord(stop.item); });
    content.append(open);
  }
  function choose(id, stop, explain, action) {
    setTrailState(researchIndex.trailById.get(id), stop, explain);
    update(); change(action);
  }
  select.addEventListener('change', () => choose(select.value, null, true, 'overview'));
  archive.addEventListener('click', () => choose(null, null, false, 'archive'));
  explainButton.addEventListener('click', () => {
    const state = getTrailState(); choose(state.trail, state.stop, !state.explain, 'panel');
  });
  document.getElementById('trail-close').addEventListener('click', () => {
    const state = getTrailState(); choose(state.trail, state.stop, false, 'panel'); explainButton.focus();
  });
  overview.addEventListener('click', () => change('overview'));
  function step(delta) {
    const trail = getActiveTrail(); if (!trail) return;
    const index = trail.stops.findIndex(stop => stop.id === getTrailState().stop);
    const stop = trail.stops[index + delta];
    if (stop) choose(trail.id, stop.id, true, 'stop');
  }
  back.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  return {
    restore(state) { setTrailState(researchIndex.trailById.get(state.trail), state.stop, state.explain); update(); },
    hidePanel() { const s = getTrailState(); setTrailState(getActiveTrail(), s.stop, false); update(); },
    renderRoute(timeline, width, axisY) {
      const trail = getActiveTrail(); if (!trail) return;
      const points = layoutTrailLabels(trail.stops.map((stop, index) => ({ stop, index, x: yearToX(resolveItem(stop.item).item.year, width) })), width);
      const railY = trailRouteRailY(axisY, Math.max(...points.map(point => point.row)));
      const layer = element('div', null, 'trail-route');
      layer.setAttribute('role', 'group'); layer.setAttribute('aria-label', `${trail.title}: dated route`);
      const rail = element('div', null, 'trail-route-line');
      rail.style.left = `${points[0].x}px`; rail.style.width = `${points.at(-1).x - points[0].x}px`; rail.style.top = `${railY}px`;
      layer.append(rail);
      for (const point of points) {
        const { stop, index, x, left, row } = point;
        const record = resolveItem(stop.item);
        const button = element('button', null, 'trail-route-stop'); button.type = 'button';
        button.dataset.trailStop = stop.id; button.setAttribute('aria-current', String(getTrailState().stop === stop.id ? 'step' : 'false'));
        button.style.left = `${left}px`; button.style.top = `${railY - 64 - row * 64}px`;
        const surname = (scientists[record.scientistId]?.name || record.item.discoverer || '').split(' ').at(-1);
        button.append(element('b', `${index + 1} · ${surname} · ${record.item.year}`), element('span', stop.label));
        button.addEventListener('click', () => choose(trail.id, stop.id, true, 'stop'));
        const anchor = element('div', null, 'trail-route-anchor'); anchor.setAttribute('aria-hidden', 'true');
        anchor.style.left = `${x}px`; anchor.style.top = `${railY}px`;
        const stitch = element('div', null, 'trail-route-stitch'); stitch.setAttribute('aria-hidden', 'true');
        stitch.style.left = `${x}px`; stitch.style.top = `${railY - 9 - row * 64}px`; stitch.style.height = `${row * 64 + 9}px`;
        layer.append(stitch, anchor, button);
      }
      timeline.append(layer);
    }
  };
}
