import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { scientificStoryRecords } from '../src/storyScience.js';
import { buildItemIndex } from '../src/itemIdentity.js';
import { layoutStory, foldStory, storyYearX, exposedStory } from '../src/storyLayout.js';
import { setScaleMode } from '../src/timeScale.js?v=3';
const yaml=createRequire(import.meta.url)('../vendor/js-yaml.min.js');
const data=file=>yaml.load(readFileSync(new URL(`../data/${file}.yaml`,import.meta.url),'utf8'));
const scientists=data('scientists'), discoveries=data('discoveries'), significantEvents=data('significantevents');

test('comet observations resolve canonical science without redating the 1705 publication or 1758 discovery',()=>{
  const topics=scientificStoryRecords(scientists,discoveries), index=buildItemIndex({scientists,discoveries,significantEvents});
  assert.deepEqual(topics.map(t=>[t.startYear,t.endYear]),[[1682,1682],[1758,1759]]);
  const paper=index.resolve(topics[0].itemKey), recovery=index.resolve(topics[1].itemKey);
  assert.equal(paper.type,'publication'); assert.equal(paper.item.year,1705);
  assert.match(paper.item.abstract,/1682/);
  assert.equal(recovery.type,'discovery'); assert.equal(recovery.item.year,1758);
  assert.match(recovery.item.details,/Palitzsch/); assert.match(recovery.item.details,/1759/);
  for(const item of [paper.item,recovery.item]) assert.ok(item.sources.some(s=>s.url.startsWith('https://')));
});

test('both comet scenes share historical panels, retain native material and remain centred on their observation years',()=>{
  const topics=scientificStoryRecords(scientists,discoveries);
  for(const mode of ['linear','density']) {
    setScaleMode(mode);
    const layout=layoutStory([...significantEvents,...topics],1126,120), pose=foldStory(layout,1126,32);
    for(const topic of topics) {
      const record=layout.records.find(r=>r.event.id===topic.id);
      assert.equal(record.subjects.length,1);
      const subject=record.subjects[0], position=storyYearX(topic.startYear,pose);
      assert.ok(position>=subject.sourceX && position<=subject.sourceX+subject.sourceWidth);
      const panel=layout.panels.find(p=>p.id===subject.panel);
      assert.ok(panel.subjects.some(([id])=>id.startsWith('event-')));
      const visible=exposedStory(pose).reduce((sum,f)=>sum+Math.max(0,
        Math.min(f.sourceX+f.width,subject.sourceX+subject.sourceWidth)-Math.max(f.sourceX,subject.sourceX)),0);
      assert.ok(Math.abs(visible-subject.sourceWidth)<1e-7);
    }
  }
  setScaleMode('linear');
});
