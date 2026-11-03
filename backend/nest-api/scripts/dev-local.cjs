// Opt-in local developer runner. Uses its own persistent cluster, never legacy data.
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomBytes,randomUUID}=require('node:crypto');
const {execFile,fork}=require('node:child_process');
const {promisify}=require('node:util');
const {once}=require('node:events');
const {loadConfig}=require('../dist/config');
const {LocalPostgres}=require('./local-postgres.cjs');

async function main() {
  const directory=path.resolve('.local-db');
  await fs.mkdir(directory,{recursive:true});
  const settingsFile=path.join(directory,'settings.json');
  let settings;
  try { settings=JSON.parse(await fs.readFile(settingsFile,'utf8')); }
  catch(error) {
    if(error.code!=='ENOENT') throw error;
    settings={password:randomBytes(24).toString('hex'),token:randomBytes(32).toString('hex'),ownerId:randomUUID()};
    await fs.writeFile(settingsFile,JSON.stringify(settings),{flag:'wx',mode:0o600});
  }
  const port=Number(process.env.LOCAL_PG_PORT??5433);
  if(!Number.isInteger(port)||port<1024||port>65535) throw new Error('Invalid local database port');
  const env={...process.env,
    DATABASE_URL:`postgresql://studio:${settings.password}@127.0.0.1:${port}/studio?schema=public&connection_limit=5&pool_timeout=5&connect_timeout=5&socket_timeout=5`,
    OWNER_API_KEYS:JSON.stringify([{ownerId:settings.ownerId,token:settings.token}]),
    PORT:process.env.PORT??'8002',
  };
  loadConfig(env);
  await fs.writeFile(path.join(directory,'connection.env'),`DATABASE_URL=${env.DATABASE_URL}\nOWNER_API_KEYS=${env.OWNER_API_KEYS}\nPORT=${env.PORT}\n`,{mode:0o600});
  const pg=await LocalPostgres.create({databaseDir:path.join(directory,'data'),user:'studio',password:settings.password,port});
  let child,started=false,stopping=false;
  const stop=()=>{stopping=true;if(child&&child.exitCode===null)child.kill();};
  const onMessage=message=>{if(message==='shutdown')stop();};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
  process.on('message',onMessage);
  try {
    try { await fs.access(path.join(directory,'data','PG_VERSION')); }
    catch(error) { if(error.code==='ENOENT') await pg.initialise(); else throw error; }
    await pg.start();started=true;
    const client=pg.getPgClient();await client.connect();
    try {
      const exists=await client.query('SELECT 1 FROM pg_database WHERE datname=$1',['studio']);
      if(!exists.rowCount) await client.query('CREATE DATABASE studio');
    } finally {await client.end();}
    await promisify(execFile)(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{env,timeout:45000});
    if(stopping)return;
    child=fork(path.resolve('dist/main.js'),[],{env,stdio:'inherit'});
    console.log(`Local API starting at http://127.0.0.1:${env.PORT}/api`);
    console.log('Private connection settings: .local-db/connection.env (do not share or commit).');
    const [code]=await once(child,'exit');
    if(code && !stopping) process.exitCode=1;
  } finally {
    process.off('SIGINT',stop);process.off('SIGTERM',stop);
    process.off('message',onMessage);
    if(started)await pg.stop();
  }
}
main().catch(()=>{console.error('Local startup failed. Check dependencies, available ports and local configuration.');process.exitCode=1;});
