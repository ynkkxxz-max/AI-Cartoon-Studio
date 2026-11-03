// Real PostgreSQL binaries and real Nest HTTP processes; no in-memory DB substitutes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { fork, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs/promises');
const request = require('supertest');
const { createApp } = require('../dist/app');
const { loadConfig } = require('../dist/config');
const { LocalPostgres } = require('../scripts/local-postgres.cjs');

const run = promisify(execFile);
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function freePort() {
  const server = net.createServer();
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const port=server.address().port; await new Promise(resolve=>server.close(resolve)); return port;
}
async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited=once(child,'exit'); child.kill(); await exited;
}
async function boot(env) {
  const child=fork(path.resolve('dist/main.js'),[],{env,stdio:['ignore','pipe','pipe','ipc']});
  let output=''; child.stdout.on('data',b=>{output+=b;}); child.stderr.on('data',b=>{output+=b;});
  const api=request(`http://127.0.0.1:${env.PORT}`);
  for (let i=0;i<150;i++) {
    try { if ((await api.get('/api/health')).status===200) return {child,api,logs:()=>output}; } catch {}
    if (child.exitCode!==null) throw new Error('API process exited during startup');
    await delay(100);
  }
  await stopChild(child); throw new Error('API startup timed out');
}

test('milestone 1 real PostgreSQL + API acceptance suite', {timeout:180000}, async t => {
  const port=await freePort();
  const base=path.resolve('.test-db');
  await fs.mkdir(base,{recursive:true});
  const databaseDir=path.join(base,randomUUID());
  assert.equal(path.dirname(databaseDir),base);
  const password=randomBytes(24).toString('hex');
  const pg=await LocalPostgres.create({databaseDir,user:'studio',password,port});
  const tokenA=randomBytes(32).toString('hex'), tokenB=randomBytes(32).toString('hex');
  const env={...process.env,
    DATABASE_URL:`postgresql://studio:${password}@127.0.0.1:${port}/studio?schema=public&connection_limit=5&pool_timeout=2&connect_timeout=2&socket_timeout=2`,
    OWNER_API_KEYS:JSON.stringify([
      {ownerId:'11111111-1111-4111-8111-111111111111',token:tokenA},
      {ownerId:'22222222-2222-4222-8222-222222222222',token:tokenB},
    ]), PORT:String(await freePort()), RATE_LIMIT:'1000',
  };
  let backend, app, started=false;
  try {
    await pg.initialise(); await pg.start(); started=true; await pg.createDatabase('studio');
    backend=await boot(env);
    await t.test('unmigrated PostgreSQL does not report ready',async()=>{
      assert.equal((await backend.api.get('/api/health')).status,200);
      assert.equal((await backend.api.get('/api/health/ready')).status,503);
    });
    await run(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{env,timeout:45000});
    // A second deploy must be harmless: no reset, no dropped data, no duplicate migration.
    await run(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{env,timeout:45000});
    const auth=(r,token=tokenA)=>r.set('Authorization',`Bearer ${token}`);
    let project;

    await t.test('liveness and migrated-database readiness are real',async()=>{
      assert.equal((await backend.api.get('/api/health')).status,200);
      const ready=await backend.api.get('/api/health/ready');
      assert.equal(ready.status,200); assert.equal(ready.body.database,'up');
    });
    await t.test('authentication, security headers and exact CORS allowlist',async()=>{
      assert.equal((await backend.api.get('/api/projects')).status,401);
      assert.equal((await auth(backend.api.get('/api/projects'),'x'.repeat(64))).status,401);
      const allowed=await backend.api.options('/api/projects').set('Origin','http://localhost:5173').set('Access-Control-Request-Method','POST').set('Access-Control-Request-Headers','authorization,content-type');
      assert.equal(allowed.headers['access-control-allow-origin'],'http://localhost:5173');
      const denied=await backend.api.get('/api/health').set('Origin','https://untrusted.example');
      assert.equal(denied.headers['access-control-allow-origin'],undefined);
      assert.equal(denied.headers['x-content-type-options'],'nosniff');
      assert.match(denied.headers['x-request-id'],/^[a-f0-9-]{36}$/);
      assert.equal(denied.headers['cache-control'],'no-store');
    });
    await t.test('create returns persisted Unicode project without invented scenes or provider calls',async()=>{
      const result=await auth(backend.api.post('/api/projects')).send({name:'រឿងខ្មែរ — project',type:'cartoon',languages:['km','en','zh'],story_prompt:'A real saved idea',metadata:{timeline:{clips:[]}}});
      assert.equal(result.status,201,JSON.stringify(result.body)); project=result.body;
      assert.equal(project.name,'រឿងខ្មែរ — project'); assert.equal(project.version,1);
      assert.equal(project.status,'draft'); assert.equal(project.pipeline_step,0);
      assert.deepEqual(project.languages,['km','en','zh-CN']);
      assert.deepEqual(project.metadata,{timeline:{clips:[]}});
      const client=pg.getPgClient('studio'); await client.connect();
      try {
        const rows=await client.query('SELECT name, owner_id, version FROM projects WHERE id=$1',[project.id]);
        assert.equal(rows.rows[0].name,project.name);
        assert.equal(rows.rows[0].owner_id,'11111111-1111-4111-8111-111111111111');
      } finally { await client.end(); }
    });
    await t.test('list/search/get are scoped and validate pagination/IDs',async()=>{
      assert.equal((await auth(backend.api.get('/api/projects'))).body.length,1);
      assert.equal((await auth(backend.api.get('/api/projects?search=project&limit=1'))).body[0].id,project.id);
      assert.equal((await auth(backend.api.get('/api/projects?search=absent'))).body.length,0);
      assert.equal((await auth(backend.api.get(`/api/projects/${project.id}`))).body.name,project.name);
      assert.equal((await auth(backend.api.get('/api/projects?limit=101'))).status,400);
      assert.equal((await auth(backend.api.get('/api/projects/not-a-uuid'))).status,400);
    });
    await t.test('foreign owner cannot list/read/save/archive another owner project',async()=>{
      assert.deepEqual((await auth(backend.api.get('/api/projects'),tokenB)).body,[]);
      assert.equal((await auth(backend.api.get(`/api/projects/${project.id}`),tokenB)).status,404);
      assert.equal((await auth(backend.api.patch(`/api/projects/${project.id}`),tokenB).send({name:'stolen',version:1})).status,404);
      assert.equal((await auth(backend.api.delete(`/api/projects/${project.id}`),tokenB).set('If-Match','"1"')).status,404);
    });
    await t.test('strict inputs, malformed JSON and payload limits return safe errors',async()=>{
      for(const body of [{name:' '},{name:'x',owner_id:'attacker'},{name:'x',status:'ready'},{name:'x',languages:['zh','zh-CN']}]) {
        assert.equal((await auth(backend.api.post('/api/projects')).send(body)).status,400);
      }
      assert.equal((await auth(backend.api.post('/api/projects')).set('Content-Type','application/json').send('{broken')).status,400);
      assert.equal((await auth(backend.api.post('/api/projects')).send({name:'large',story_prompt:'x'.repeat(300000)})).status,413);
    });
    await t.test('concurrent saves have exactly one winner and return 409 to the stale writer',async()=>{
      const results=await Promise.all(['First save','Second save'].map(name=>auth(backend.api.patch(`/api/projects/${project.id}`)).send({name,version:1})));
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
      project=results.find(r=>r.status===200).body; assert.equal(project.version,2);
      assert.equal((await auth(backend.api.patch(`/api/projects/${project.id}`)).send({name:'no version'})).status,400);
    });
    await t.test('project survives actual backend process termination and reopening',async()=>{
      await stopChild(backend.child); backend=await boot(env);
      const reopened=await auth(backend.api.get(`/api/projects/${project.id}`));
      assert.equal(reopened.status,200); assert.deepEqual(reopened.body,project);
    });
    await t.test('saved project also survives a PostgreSQL process restart',async()=>{
      await stopChild(backend.child);await pg.stop();started=false;
      await pg.start();started=true;backend=await boot(env);
      const reopened=await auth(backend.api.get(`/api/projects/${project.id}`));
      assert.equal(reopened.status,200);assert.deepEqual(reopened.body,project);
    });
    await t.test('versioned delete archives without physically destroying the saved row',async()=>{
      assert.equal((await auth(backend.api.delete(`/api/projects/${project.id}`))).status,428);
      assert.equal((await auth(backend.api.delete(`/api/projects/${project.id}`)).set('If-Match','"1"')).status,409);
      assert.equal((await auth(backend.api.delete(`/api/projects/${project.id}`)).set('If-Match','"2"')).status,204);
      assert.equal((await auth(backend.api.get(`/api/projects/${project.id}`))).status,404);
      assert.deepEqual((await auth(backend.api.get('/api/projects'))).body,[]);
      const client=pg.getPgClient('studio'); await client.connect();
      try { assert.ok((await client.query('SELECT archived_at FROM projects WHERE id=$1',[project.id])).rows[0].archived_at); }
      finally { await client.end(); }
    });
    await t.test('per-route request throttling returns 429',async()=>{
      app=await createApp(loadConfig({...env,RATE_LIMIT:'3'}),false); await app.listen(0,'127.0.0.1');
      const limited=request(app.getHttpServer());
      for(let i=0;i<3;i++) assert.equal((await limited.get('/api/health')).status,200);
      assert.equal((await limited.get('/api/health')).status,429);
      await app.close(); app=null;
    });
    await t.test('database outage makes readiness 503 while liveness stays up; secrets never reach responses/logs',async()=>{
      const unusedPort=await freePort();
      app=await createApp(loadConfig({...env,DATABASE_URL:`postgresql://studio:${password}@127.0.0.1:${unusedPort}/studio?connect_timeout=1&pool_timeout=1`}),false);
      await app.listen(0,'127.0.0.1'); const offline=request(app.getHttpServer());
      assert.equal((await offline.get('/api/health')).status,200);
      const failed=await offline.get('/api/health/ready'); assert.equal(failed.status,503);
      const failedCrud=await auth(offline.get('/api/projects')); assert.equal(failedCrud.status,503);
      for(const secret of [password,tokenA,tokenB,env.DATABASE_URL]) {
        assert.ok(!JSON.stringify(failed.body).includes(secret));
        assert.ok(!JSON.stringify(failedCrud.body).includes(secret));
        assert.ok(!backend.logs().includes(secret));
      }
    });
  } finally {
    if(app) await app.close();
    await stopChild(backend?.child);
    if(started) await pg.stop();
  }
});
