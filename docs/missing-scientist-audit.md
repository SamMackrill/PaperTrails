# Discovery and conference scientist audit

Scope: scientists named in existing discovery and conference records, as requested. General historical figures such as Gutenberg and Mercator are outside this pass. A name in a photograph caption establishes a candidate to investigate; it does not establish a complete biography, an original publication or reusable portrait rights.

Millikan's PR adds Millikan only. The audit identified sixteen further candidates. Each addition needs verified identity and dates, selected original publications, sourced portrait rights, a matching illustration or an explicitly documented neutral fallback, stable record identities and working links to the record that names them.

| Candidate | Existing mention | Implementation state |
| --- | --- | --- |
| Robert Andrews Millikan | Elementary charge measurement | Added in [#96](https://github.com/SamMackrill/PaperTrails/pull/96), merged |
| Otto Stern | Stern–Gerlach experiment | Added with Gerlach in [#99](https://github.com/SamMackrill/PaperTrails/pull/99), merged |
| Walther Gerlach | Stern–Gerlach experiment | Added with Stern in [#99](https://github.com/SamMackrill/PaperTrails/pull/99), merged |
| Robert Curtis Retherford | Lamb-shift measurement | Implemented with two verified original papers, year-only life dates and a neutral portrait |
| Yakir Aharonov | Aharonov–Bohm effect | Implemented in the quantum-scientist layer |
| Alain Aspect | Bell-test experiment | Implemented in the quantum-scientist layer |
| Jean Dalibard | Bell-test experiment | Implemented in the quantum-scientist layer |
| Gérard Roger | Bell-test experiment | Implemented with two verified original papers; unverified life dates/nationality omitted and neutral portrait retained |
| William Derham | Speed-of-sound measurement | Implemented in the historical-scientist layer |
| Samuel Molyneux | Stellar aberration | Implemented with verified publications and documented neutral portrait |
| Johann Georg Palitzsch | Halley's 1758–59 return | Implemented with a discovery anchor, empty publication list and sourced likeness |
| Aloysius Lilius | Gregorian calendar reform | Implemented with a discovery anchor, approximate dates, empty publication list and neutral portrait |
| Christopher Clavius | Gregorian calendar reform | Implemented in the historical-scientist layer |
| Alfred Cornu | 1900 physics congress | Implemented in the conference-scientist layer |
| Irène Joliot-Curie | 1933 Solvay photograph | Implemented in the conference-scientist layer |
| Abraham Pais | 1947 Shelter Island photograph | Implemented in the conference-scientist layer |
| Herman Feshbach | 1947 Shelter Island photograph | Implemented in the conference-scientist layer |

All seventeen candidates now have implemented profiles across the PR stack. This is implementation completion, not a claim that all layers have merged. Retherford and Roger complete the audit with four verified joint-paper records and working discovery links; [their source notes](experimental-scientist-additions.md) explicitly record remaining biographical and portrait limitations. The user confirmed that Palitzsch and Lilius may have discovery-positioned profiles without invented publications. An observer's contribution must not be presented as authorship of someone else's paper. Partial historical dates must not be expanded into invented precise dates. An unavailable licensed likeness must not be replaced by an invented face.
