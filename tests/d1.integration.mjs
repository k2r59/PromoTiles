import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

// Exercise the actual Cloudflare D1 runtime, separately from the Node adapter tests.
const mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: 'integration', modules: true, script: 'export default { fetch() { return new Response("test") } }', d1Databases: ['DB'] }] }))
try {
 const db = await mf.getD1Database('DB')
 const migration = await readFile(new URL('../migrations/0001_players_scores.sql', import.meta.url), 'utf8')
 const trigger = migration.match(/CREATE TRIGGER[\s\S]*?END;/)[0]
 for (const sql of migration.replace(trigger, '').replace(/--[^\n]*/g, '').split(';').filter(s => s.trim())) await db.prepare(sql).run()
 await db.prepare(trigger).run()
 await db.prepare('INSERT INTO players VALUES(?,?,?,?)').bind('test-player', 'qa@promo.dev', 'QA', 1).run()
 await assert.rejects(() => db.prepare('INSERT INTO players VALUES(?,?,?,?)').bind('duplicate', 'qa@promo.dev', 'QA', 1).run())
 await db.prepare('INSERT INTO rounds(id,player,song,mode,revision,started) VALUES(?,?,?,?,?,?)').bind('round', 'test-player', 'song', 'normal', 'v1', 1).run()
 const submit = () => db.prepare(`INSERT INTO performances SELECT id,player,song,mode,revision,1000,100,2,1,2,'{}' FROM rounds WHERE id=? AND used=0`).bind('round').run()
 const results = await Promise.all([submit(), submit()])
 assert.equal(results.filter(r => r.meta.changes > 0).length, 1)
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM performances').first()).n, 1)
 assert.equal((await db.prepare('SELECT used FROM rounds').first()).used, 1)
 const best = await db.prepare("SELECT s.score FROM scores s WHERE EXISTS (SELECT 1 FROM json_each(?) a WHERE json_extract(a.value,'$.id')=s.song AND json_extract(a.value,'$.revision')=s.revision)").bind('[{"id":"song","revision":"v1"}]').first()
 assert.equal(best.score, 1000)
 const nativeMigration=await readFile(new URL('../migrations/0002_native_auth.sql',import.meta.url),'utf8')
 for(const sql of nativeMigration.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await db.prepare(sql).run()
 await db.prepare("UPDATE players SET nickname_key='qa' WHERE id='test-player'").run()
 await assert.rejects(()=>db.prepare("INSERT INTO players(id,email,name,created,nickname_key) VALUES('other','other@promo.dev','qa',1,'qa')").run())
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM performances').first()).n,1)
 const avatarMigration=await readFile(new URL('../migrations/0003_avatars_anticheat.sql',import.meta.url),'utf8')
 for(const sql of avatarMigration.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await db.prepare(sql).run()
 await db.prepare("INSERT INTO auth_sessions VALUES('valid','qa@promo.dev',1,9999999999999)").run()
 await db.prepare("INSERT INTO auth_sessions VALUES('orphan','missing@promo.dev',1,9999999999999)").run()
 const sessionMigration=await readFile(new URL('../migrations/0004_session_player.sql',import.meta.url),'utf8')
 const revokeTrigger=sessionMigration.match(/CREATE TRIGGER[\s\S]*?END;/)[0]
 for(const sql of sessionMigration.replace(revokeTrigger,'').replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await db.prepare(sql).run()
 await db.prepare(revokeTrigger).run()
 assert.equal((await db.prepare("SELECT player FROM auth_sessions WHERE digest='valid'").first()).player,'test-player')
 assert.equal(await db.prepare("SELECT * FROM auth_sessions WHERE digest='orphan'").first(),null)
 await db.prepare("INSERT INTO players(id,email,name,created) VALUES('temporary','temporary@promo.dev','Temporary',1)").run()
 await db.prepare("INSERT INTO auth_sessions VALUES('temporary-session','temporary@promo.dev',1,9999999999999,'temporary')").run()
 await db.prepare("INSERT INTO auth_codes(id,email,digest,expires) VALUES('pending-code','temporary@promo.dev','hash',9999999999999)").run()
 await db.prepare("DELETE FROM players WHERE id='temporary'").run()
 assert.equal(await db.prepare("SELECT * FROM auth_sessions WHERE digest='temporary-session'").first(),null)
 assert.equal(await db.prepare("SELECT * FROM auth_codes WHERE id='pending-code'").first(),null)
 console.log('D1 runtime: migrations, unique email, concurrent submission, atomic best score and JSON catalogue passed')
} finally { await mf.dispose() }
