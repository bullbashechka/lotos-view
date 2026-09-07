import { test } from 'node:test';
import assert from 'node:assert/strict';
import tour from '../src/data/tour.json';
import { house } from '../src/data/house';
import { chapters, chapterForScene, sceneIndexForId, sceneEntryTime } from '../src/features/tour/navigation';
import { sceneForTime } from '../src/features/tour/timeline';

test('every room links to a real scene and every scene belongs to one ordered chapter', () => {
  for (const room of house.rooms) assert.ok(sceneIndexForId(room.scene) >= 0, room.name);
  assert.equal(sceneIndexForId('missing'), -1);
  assert.equal(chapters.length, 5);
  for (let i = 0; i < tour.scenes.length; i++) {
    const chapter = chapterForScene(i);
    assert.ok(i >= chapters[chapter]!.start);
    assert.ok(i < (chapters[chapter + 1]?.start ?? tour.scenes.length));
  }
});

test('direct selection lands inside every intended scene, including the first and last', () => {
  for (let i = 0; i < tour.scenes.length; i++) {
    const time = sceneEntryTime(i);
    assert.equal(sceneForTime(time, tour.scenes, tour.transition), i);
    assert.ok(time >= 0 && time < tour.duration);
  }
});
