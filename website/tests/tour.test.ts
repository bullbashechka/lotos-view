import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
import { progressForScroll, timeForProgress, sceneForTime, scrollForTime, LatestSeek } from '../src/features/tour/timeline';

describe('scroll-driven tour', () => {
 test('clamps before/after, advances and reverses', () => {
  assert.equal(progressForScroll(0, 200, 1000),0);
  assert.equal(progressForScroll(700, 200, 1000),.5);
  assert.equal(progressForScroll(1700, 200, 1000),1);
  assert.equal(progressForScroll(300, 200, 1000),.1);
  assert.equal(progressForScroll(700, 200, 0),0);
 });
 test('never seeks beyond final decoded frame', () => {
  assert.ok(Math.abs((timeForProgress(1, 10, 24))-(10-1/24))<1e-6);
  assert.equal(timeForProgress(-1, 10, 24),0);
 });
 test('scene switches halfway through a transition', () => {
  const scenes=[{start:0,end:3},{start:2.75,end:6}];
  assert.equal(sceneForTime(2.85, scenes, .25),0);
  assert.equal(sceneForTime(2.9, scenes, .25),1);
 });
 test('navigation round trip survives a resized scroll track', () => {
  const y=scrollForTime(8, 40, 700, 8000);
  assert.ok(Math.abs((progressForScroll(y,700,8000)*40)-(8))<1e-6);
  assert.equal(scrollForTime(8,40,700,4000),1500);
 });
 test('keeps only latest request while decoder is busy and freezes at rest', () => {
  const writes:number[]=[];const media={currentTime:0,seeking:false,readyState:0};
  const seeker=new LatestSeek(media,t=>{writes.push(t);media.currentTime=t;media.seeking=true;});
  seeker.request(2);assert.deepEqual(writes,[]);
  media.readyState=2;seeker.flush();assert.deepEqual(writes,[2]);
  seeker.request(4);seeker.request(9);assert.deepEqual(writes,[2]);
  media.seeking=false;seeker.flush();assert.deepEqual(writes,[2,9]);
  media.seeking=false;seeker.flush();assert.deepEqual(writes,[2,9]);
  seeker.dispose();seeker.request(1);assert.deepEqual(writes,[2,9]);
 });
});
