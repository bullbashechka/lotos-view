import { it as test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/media.js';

const env = {
  ASSETS: { fetch: async () => new Response('0123456789', { headers: { 'Content-Type': 'video/mp4', ETag: '"demo"' } }) },
};
const request = (range: string) => new Request('https://example.com/media/tour-desktop.mp4', { headers: { Range: range } });

test('video seeking returns the requested bytes and total size', async () => {
  const response = await worker.fetch(request('bytes=3-5'), env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 3-5/10');
  assert.equal(response.headers.get('Content-Length'), '3');
  assert.equal(await response.text(), '345');
});

test('open-ended and suffix ranges work', async () => {
  assert.equal(await (await worker.fetch(request('bytes=7-'), env)).text(), '789');
  assert.equal(await (await worker.fetch(request('bytes=-2'), env)).text(), '89');
});

test('out-of-bounds range returns 416', async () => {
  const response = await worker.fetch(request('bytes=10-'), env);
  assert.equal(response.status, 416);
  assert.equal(response.headers.get('Content-Range'), 'bytes */10');
});

test('unsupported ranges fall back to the full response', async () => {
  const response = await worker.fetch(request('bytes=0-1,3-4'), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '0123456789');
});

test('If-Range mismatch returns the full current representation', async () => {
  const req = request('bytes=3-5');
  req.headers.set('If-Range', '"older"');
  assert.equal((await worker.fetch(req, env)).status, 200);
});

test('missing media returns 404; other files stay with Static Assets', async () => {
  assert.equal((await worker.fetch(request('bytes=0-1'), { ASSETS: { fetch: async () => new Response(null, { status: 404 }) } })).status, 404);
  assert.equal(await (await worker.fetch(new Request('https://example.com/'), env)).text(), '0123456789');
});
