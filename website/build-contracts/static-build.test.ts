import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const dist=resolve(root,'dist');
test('static presentation retains content and fallback with an interactive tour and safe demo enquiry',()=>{
 assert.ok(existsSync(dist),'Run bun run build:website first');
 const html=readFileSync(resolve(dist,'index.html'),'utf8');
 assert.match(html,/id="request"/);
 assert.match(html,/<fieldset[^>]*disabled/);
 assert.match(html,/Демо-форма/);
 assert.match(html,/<html[^>]*lang="ru"/);
 assert.match(html,/Лотос/);assert.match(html,/id="plan"/);assert.match(html,/id="gallery"/);
 assert.match(html,/id="smooth-wrapper"/);
 assert.match(html,/id="smooth-content"/);
 assert.match(html,/<dialog[^>]*aria-labelledby="viewer-title"/);
 assert.equal((html.match(/data-gallery-index=/g)||[]).length,14);
 assert.equal((html.match(/data-room-id=/g)||[]).length,24); // Same twelve rooms on plan and list.
 assert.equal((html.match(/<video /g)||[]).length,1);
 assert.doesNotMatch(html,/<video[^>]*\ssrc=/); // JS chooses media after checking motion preferences.
 assert.doesNotMatch(html,/<video[^>]*autoplay/);
 const manifest=JSON.parse(readFileSync(resolve(dist,'media/tour.json'),'utf8'));
 assert.equal(manifest.scenes.length,14);
 for(const s of manifest.scenes)assert.ok(existsSync(resolve(dist,s.poster.slice(1))));
 for(const path of [manifest.desktop,manifest.mobile])assert.ok(existsSync(resolve(dist,path.slice(1))));
 const chunks=readdirSync(resolve(dist,'_astro')).filter(n=>n.endsWith('.js')).map(n=>readFileSync(resolve(dist,'_astro',n),'utf8')).join('\n');
 assert.doesNotMatch(chunks,/data-hero-scene-canvas/);
});

test('demo phone accepts formatted numbers and rejects incomplete or non-numeric input',()=>{
 const html=readFileSync(resolve(dist,'index.html'),'utf8');
 const input=html.match(/<input[^>]*id="enquiry-phone"[^>]*>/)?.[0];
 assert.ok(input);
 const pattern=input.match(/pattern="([^"]+)"/)?.[1];
 assert.ok(pattern);
 const phone=new RegExp(`^(?:${pattern})$`,'v');
 for(const value of ['+7 (000) 000-00-00','70000000000','+1 202 555 0100']) assert.ok(phone.test(value));
 for(const value of ['', '123','abcdefghij','+7 000 abc 0000','1234567890123456']) assert.ok(!phone.test(value));
});
