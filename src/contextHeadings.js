import { contextDate } from './contextModel.js?v=pass2-chapters-v2';

// Modern Latin inscriptions inspired by the Bayeux captions. English event
// names and recorded dates remain available in tooltips and event details.
export const latinHeadings = new Map([
  ['The Renaissance', 'RENOVATIO ARTIVM'],
  ['Fall of Constantinople', 'CONSTANTINOPOLIS CAPTA'],
  ['Early Columbian Exchange', 'COMMERCIVM INTER CONTINENTES'],
  ['Protestant Reformation', 'REFORMATIO ECCLESIAE'],
  ['The Little Ice Age', 'AETAS GLACIEI'],
  ["Thirty Years' War", 'BELLVM TRIGINTA ANNORVM'],
  ['English Civil War', 'BELLVM CIVILE ANGLICVM'],
  ['Major European Famine', 'FAMES EVROPAE'],
  ['War of the Spanish Succession', 'BELLVM DE SVCCESSIONE HISPANICA'],
  ['Great Frost of 1709', 'MAGNVM FRIGVS'],
  ["The Seven Years' War", 'BELLVM SEPTEM ANNORVM'],
  ['American Revolution', 'AMERICA AD LIBERTATEM'],
  ['Signing of the United States Constitution', 'CONSTITVTIO AMERICANA'],
  ['French Revolution', 'RES NOVAE FRANCIAE'],
  ['Reign of Napoleon', 'IMPERIVM NAPOLEONIS'],
  ['Carrington Event', 'AVRORA ET FILA ELECTRICA'],
  ['American Civil War', 'BELLVM CIVILE AMERICANVM'],
  ['World War I', 'BELLVM MVNDANVM PRIMVM'],
  ['Great Depression', 'MAGNA INOPIA'],
  ['World War II', 'BELLVM MVNDANVM SECVNDVM'],
  ['Cold War', 'BELLVM FRIGIDVM'],
  ['Industrial Revolution in Britain', 'MACHINAE ET OFFICINAE'],
  ['Transatlantic slave trade', 'SERVITVS ATLANTICA'],
  ['Haitian Revolution', 'LIBERTAS HAITIAE'],
  ['Electric telegraph networks', 'NVNTII PER FILA']
]);

export function contextHeading(event, style = 'landscape', continuing = false) {
  if (style === 'tapestry') return {
    title: `${latinHeadings.get(event.title) || event.title}${continuing ? ' · PERGIT' : ''}`,
    date: '', lang: latinHeadings.has(event.title) ? 'la' : 'en'
  };
  return { title: `${event.title}${continuing ? ' (continuing)' : ''}`,
    date: ` · ${contextDate(event)}`, lang: 'en' };
}
