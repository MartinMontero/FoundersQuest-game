import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } })
await page.addInitScript(([k, v]) => window.localStorage.setItem(k, v),
  ['founders-quest:settings', JSON.stringify({ fallbackAccepted: false, founderName: 'Montero' })])
await page.goto('http://localhost:5290/?render=constrained')
await page.waitForFunction(() => window.__fq_fps !== undefined, undefined, { timeout: 90000 })
await page.waitForFunction(() => window.__fq_rocks !== undefined, undefined, { timeout: 20000 })
await page.waitForTimeout(600)
const pos = () => page.evaluate(() => window.__fq_player)
const rocks = await page.evaluate(() => window.__fq_rocks)
const spawn = await pos()
// pick a rock roughly SOUTH of spawn (+z side, toward camera) reachable by KeyS,
// with |x - spawn.x| small so a straight strafe-free walk hits it
const cand = rocks
  .filter(r => r.z > spawn.z - 1 && Math.abs(r.x - spawn.x) < 1.2 && r.r > 0.15)
  .sort((a,b) => Math.abs(a.z-spawn.z) - Math.abs(b.z-spawn.z))[0]
  || rocks.filter(r => Math.abs(r.x-spawn.x)<1.5).sort((a,b)=>Math.hypot(a.x-spawn.x,a.z-spawn.z)-Math.hypot(b.x-spawn.x,b.z-spawn.z))[0]
console.log('spawn:', JSON.stringify(spawn), 'target rock:', JSON.stringify(cand))
// align x to the rock, then walk toward it along z; confirm we STOP short (dist ~ r+0.4), not pass through
async function hold(key, ms){ await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(120) }
// strafe to align x
for (let i=0;i<14;i++){ const p=await pos(); if (Math.abs(p.x-cand.x)<0.25) break; await hold(p.x>cand.x?'KeyA':'KeyD',180) }
// walk toward the rock in z (KeyS = +z, KeyW = -z)
const dir = cand.z > (await pos()).z ? 'KeyS' : 'KeyW'
let minDist = 999
for (let i=0;i<26;i++){ await hold(dir, 220); const p=await pos(); const d=Math.hypot(p.x-cand.x,p.z-cand.z); if(d<minDist)minDist=d; if(d < cand.r + 0.42 + 0.05) break }
const p = await pos()
const finalDist = Math.hypot(p.x-cand.x, p.z-cand.z)
console.log('final pos:', JSON.stringify(p), 'finalDist:', finalDist.toFixed(2), 'minDist:', minDist.toFixed(2), 'expected stop ~', (cand.r+0.4).toFixed(2))
console.log('BLOCKED (did not pass through):', minDist > cand.r + 0.2 ? 'YES' : 'NO — passed through')
await browser.close()
