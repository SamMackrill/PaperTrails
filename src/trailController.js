import { resolveItem, researchIndex, scientists, trails } from './dataLoader.js?v=pass2-story-v2';
import { RELATION_LABELS } from './researchModel.js?v=pass2-04';
import { yearToX } from './timeScale.js?v=3';
import { element, stopContent } from './trailContent.js?v=pass2-06b';
import { getActiveTrail, getTrailState, getTrailStepContext, layoutTrailLabels, setTrailState, trailRouteRailY } from './trailState.js?v=pass2-06d';

export function setupTrails({ change, openRecord }) {
  const bar = document.getElementById('trail-bar');
  const select = document.getElementById('trail-select');
  const eraJumps = document.getElementById('era-jumps');
  const stepControls = document.getElementById('trail-step-controls');
  const panel = document.getElementById('trail-panel');
  const stepper = document.getElementById('trail-stepper');
  const content = document.getElementById('trail-content');
  const panelNav = document.getElementById('trail-panel-nav');
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
    const stepCtx = getTrailStepContext(trail, state.stop);
    const index = stepCtx.index;
    select.value = state.trail || '';
    bar.classList.toggle('is-active', Boolean(trail));
    if (eraJumps) eraJumps.hidden = Boolean(trail);
    if (stepControls) stepControls.hidden = !trail;
    back.disabled = !trail || !stepCtx.prev;
    next.disabled = !trail || !stepCtx.next;
    const printLink = document.getElementById('trail-print');
    [explainButton, overview, archive, printLink].forEach(button => { button.hidden = !trail; });
    printLink.href = trail ? `print-trail.html?trail=${encodeURIComponent(trail.id)}` : './';
    progress.textContent = trail ? `${index + 1} / ${stepCtx.total}` : 'Choose an idea trail';
    panel.hidden = !state.explain;
    explainButton.setAttribute('aria-expanded', String(state.explain));
    document.body.classList.toggle('has-trail-panel', state.explain);
    document.body.classList.toggle('has-active-trail', Boolean(trail));
    stepper?.replaceChildren();
    content.replaceChildren();
    panelNav?.replaceChildren();
    if (!trail) return;
    if (stepper) {
      trail.stops.forEach((s, i) => {
        const rec = resolveItem(s.item);
        const dot = element('button', String(i + 1), 'trail-stepper-dot');
        dot.type = 'button';
        dot.dataset.trailState = stepCtx.states[i];
        dot.setAttribute('aria-current', i === index ? 'step' : 'false');
        dot.setAttribute('aria-label', `Stop ${i + 1}: ${s.label} (${rec.item.year})`);
        dot.title = `Stop ${i + 1} (${rec.item.year}): ${s.label}`;
        dot.addEventListener('click', () => choose(trail.id, s.id, true, 'stop'));
        stepper.append(dot);
      });
    }
    const stop = stepCtx.current, record = resolveItem(stop.item);
    const author = scientists[record.scientistId]?.name || record.item.discoverer || '';
    const relation = researchIndex.relationById.get(stop.relation);
    content.append(element('p', trail.question, 'trail-question'), element('p', `STOP ${index + 1} · ${record.item.year} · ${author}`, 'trail-kicker'));
    content.append(element('h2', record.item.title));
    content.append(stopContent(stop, record, relation, RELATION_LABELS[relation?.kind]));
    const open = element('button', 'Open the timeline record →', 'trail-record-cta'); open.type = 'button';
    open.addEventListener('click', () => { setTrailState(trail, stop.id, false); update(); openRecord(stop.item); });
    content.append(open);
    if (panelNav) {
      const makeNav = (targetStop, direction) => {
        const slot = element('div', null, `trail-panel-nav-slot is-${direction}`);
        if (!targetStop) return slot;
        const targetRecord = resolveItem(targetStop.item);
        const btn = element('button', null, 'trail-panel-nav-btn');
        btn.type = 'button';
        const dir = element('span', direction === 'prev' ? `← Stop ${index} · ${targetRecord.item.year}` : `Stop ${index + 2} · ${targetRecord.item.year} →`, 'trail-panel-nav-dir');
        const label = element('span', targetStop.label, 'trail-panel-nav-label');
        btn.append(dir, label);
        btn.addEventListener('click', () => choose(trail.id, targetStop.id, true, 'stop'));
        slot.append(btn);
        return slot;
      };
      panelNav.append(makeNav(stepCtx.prev, 'prev'), makeNav(stepCtx.next, 'next'));
    }
    panel.scrollTop = 0;
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
    openTrail(id, stopId = null, action = 'overview') { choose(id, stopId, true, action); },
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
      const stepCtx = getTrailStepContext(trail, getTrailState().stop);
      for (const point of points) {
        const { stop, index, x, left, row } = point;
        const record = resolveItem(stop.item);
        const button = element('button', null, 'trail-route-stop'); button.type = 'button';
        button.dataset.trailStop = stop.id;
        button.dataset.trailState = stepCtx.states[index];
        button.setAttribute('aria-current', String(getTrailState().stop === stop.id ? 'step' : 'false'));
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
