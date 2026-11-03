const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../dist/config');
const { createSchema, updateSchema, listSchema } = require('../dist/projects/validation');
const { ProjectsService } = require('../dist/projects/projects.service');

const env = {
  DATABASE_URL: 'postgresql://studio:local@127.0.0.1:5433/studio',
  OWNER_API_KEYS: JSON.stringify([{ownerId:'11111111-1111-4111-8111-111111111111',token:'a'.repeat(48)}]),
};
test('configuration rejects absent/weak/duplicate tokens and wildcard CORS', () => {
  assert.throws(() => loadConfig({...env, OWNER_API_KEYS: undefined}));
  assert.throws(() => loadConfig({...env, OWNER_API_KEYS: '[{"ownerId":"bad","token":"short"}]'}));
  const key = JSON.parse(env.OWNER_API_KEYS)[0];
  assert.throws(() => loadConfig({...env, OWNER_API_KEYS: JSON.stringify([key,key])}));
  assert.throws(() => loadConfig({...env, CORS_ORIGINS:'*'}));
  assert.throws(() => loadConfig({...env, DATABASE_URL:'file:studio.db'}));
  assert.equal(loadConfig(env).port, 8002);
});
test('project validation trims names and normalizes legacy zh to zh-CN', () => {
  const p = createSchema.parse({name:'  រឿងខ្មែរ  ',languages:['km','zh']});
  assert.equal(p.name,'រឿងខ្មែរ');
  assert.deepEqual(p.languages,['km','zh-CN']);
});
test('project validation rejects empty names, unsupported values, duplicate languages, and ownership injection', () => {
  for (const invalid of [
    {name:'   '}, {name:'x'.repeat(201)}, {name:'x',ownerId:'attacker'},
    {name:'x',languages:[]}, {name:'x',languages:['zh','zh-CN']},
    {name:'x',languages:['fr']}, {name:'x',resolution:'8k'},
    {name:'x',type:'cartoon',project_type:'video_editor'},
    {name:'x',status:'completed'}, {name:'x',pipeline_step:7}, {name:'x',metadata:null},
  ]) assert.equal(createSchema.safeParse(invalid).success,false);
});
test('updates require a changed field and valid version; null cannot clear required fields', () => {
  for (const invalid of [{name:'x'}, {version:1}, {version:0,name:'x'}, {version:1,name:null}]) {
    assert.equal(updateSchema.safeParse(invalid).success,false);
  }
  assert.equal(updateSchema.parse({version:1,name:'rename'}).name,'rename');
});
test('list queries are bounded and strict', () => {
  assert.deepEqual(listSchema.parse({}),{limit:50,offset:0});
  assert.equal(listSchema.safeParse({limit:'101'}).success,false);
  assert.equal(listSchema.safeParse({offset:'-1'}).success,false);
  assert.equal(listSchema.safeParse({ownerId:'attacker'}).success,false);
});
test('save conflict is 409 for own project and 404 for missing/foreign project', async () => {
  const service = new ProjectsService({update:async()=>null,find:async()=>null});
  await assert.rejects(service.update('owner','id',{version:1,name:'x'}),e=>e.getStatus()===404);
  service.get = async()=>({id:'id'});
  await assert.rejects(service.update('owner','id',{version:1,name:'x'}),e=>e.getStatus()===409);
});
test('archive conflict does not report success or reveal foreign projects', async () => {
  const service = new ProjectsService({archive:async()=>0,find:async()=>null});
  await assert.rejects(service.archive('owner','id',1),e=>e.getStatus()===404);
  service.get = async()=>({id:'id'});
  await assert.rejects(service.archive('owner','id',1),e=>e.getStatus()===409);
});
