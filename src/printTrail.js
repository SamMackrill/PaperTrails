import { initializeData, researchIndex, resolveItem, scientists } from './dataLoader.js?v=pass2-chapters-v2';
import { RELATION_LABELS } from './researchModel.js?v=pass2-04';
import { element, stopContent } from './trailContent.js?v=pass2-06b';
import { formatHash } from './urlState.js?v=pass2-context-styles-v1';

const main = document.getElementById('print-content');
const print = document.getElementById('print');
try {
  await initializeData();
  const id = new URLSearchParams(location.search).get('trail');
  const trail = researchIndex.trailById.get(id);
  if (!trail) throw new Error('This trail is unavailable. Return to the timeline and choose a current trail.');
  document.title = `${trail.title} · Paper Trails`;
  const header = element('header');
  header.append(element('p', 'PAPER TRAILS · RESEARCH HANDOUT', 'kicker'), element('h1', trail.title), element('p', trail.question), element('p', trail.scope, 'scope'));
  main.replaceChildren(header);
  trail.stops.forEach((stop, index) => {
    const record = resolveItem(stop.item);
    const relation = researchIndex.relationById.get(stop.relation);
    const article = element('article');
    article.append(element('p', `STOP ${index + 1} / ${trail.stops.length} · ${record.item.year} · ${scientists[record.scientistId]?.name || record.item.discoverer || ''}`, 'stop-index'));
    article.append(element('h2', record.item.title), stopContent(stop, record, relation, RELATION_LABELS[relation?.kind], { expanded: true }));
    const link = element('a', 'Explore this stop on the timeline', 'return-to-timeline');
    link.href = `./${formatHash({ trail: trail.id, stop: stop.id, explain: true, from: record.item.year - 55, to: record.item.year + 55, scale: 'linear', contextMode: 'landscape' })}`;
    article.append(link); main.append(article);
  });
  main.append(element('footer', 'Evidence and relationship qualifications are included at every stop. Conceptual bridges are editorial comparisons, not unverified citations or claims of influence.'));
  main.dataset.ready = 'true'; print.disabled = false;
} catch (error) {
  main.replaceChildren(element('p', error.message));
  main.firstChild.setAttribute('role', 'alert');
} finally {
  main.setAttribute('aria-busy', 'false');
}
print.addEventListener('click', () => window.print());
