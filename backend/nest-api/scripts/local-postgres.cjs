// Thin lifecycle wrapper over the real platform binaries distributed by
// embedded-postgres. No OS profile lookup, OS-user creation or service install.
const {execFile,spawn}=require('node:child_process');
const {promisify}=require('node:util');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {Client}=require('pg');
const run=promisify(execFile);

class LocalPostgres {
  static async create(options) {
    const platform=process.platform==='win32'?'windows':process.platform;
    if(!['windows','darwin','linux'].includes(platform)) throw new Error('Unsupported local database platform');
    const binaries=await import(`@embedded-postgres/${platform}-${process.arch}`);
    if(!Number.isInteger(options.port)||options.port<1024||options.port>65535) throw new Error('Invalid PostgreSQL port');
    return new LocalPostgres(options,binaries);
  }
  constructor(options,binaries) {this.options=options;this.binaries=binaries;}
  async initialise() {
    const pwfile=path.join(path.dirname(this.options.databaseDir),`password-${randomUUID()}.tmp`);
    await fs.writeFile(pwfile,this.options.password+'\n',{flag:'wx',mode:0o600});
    try {
      await run(this.binaries.initdb,[
        '-D',this.options.databaseDir,'--username',this.options.user,
        '--pwfile',pwfile,'--auth=scram-sha-256','--encoding=UTF8','--no-locale',
      ],{timeout:45000,windowsHide:true});
    } finally {await fs.unlink(pwfile);}
  }
  async start() {
    const log=await fs.open(path.join(path.dirname(this.options.databaseDir),'postgres.log'),'a');
    try {
      this.process=spawn(this.binaries.postgres,[
        '-D',this.options.databaseDir,'-h','127.0.0.1','-p',String(this.options.port),
      ],{stdio:['ignore',log.fd,log.fd],windowsHide:true});
      await new Promise((resolve,reject)=>{this.process.once('spawn',resolve);this.process.once('error',reject);});
    } finally {await log.close();}
    for(let i=0;i<200;i++) {
      if(this.process.exitCode!==null) throw new Error('Local PostgreSQL exited; inspect its local log');
      const client=this.getPgClient();
      try {await client.connect();await client.query('SELECT 1');return;}
      catch {} finally {await client.end();}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    await this.stop();throw new Error('Local PostgreSQL readiness timed out');
  }
  async stop() {
    await run(this.binaries.pg_ctl,['-D',this.options.databaseDir,'-m','fast','-w','-t','20','stop'],{timeout:30000,windowsHide:true});
  }
  getPgClient(database='postgres') {
    return new Client({host:'127.0.0.1',port:this.options.port,user:this.options.user,password:this.options.password,database,connectionTimeoutMillis:5000});
  }
  async createDatabase(name) {
    if(!/^[a-z][a-z0-9_]{0,62}$/.test(name)) throw new Error('Invalid database name');
    const client=this.getPgClient();await client.connect();
    try {await client.query(`CREATE DATABASE "${name}"`);}finally{await client.end();}
  }
}
module.exports={LocalPostgres};
