import { createApp } from './app';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();
  const app = await createApp(config);
  await app.listen(config.port, '127.0.0.1');
}
main().catch(() => {
  // Never print configuration values, connection strings, or raw driver errors.
  process.stderr.write('Backend startup failed; check local configuration and dependencies.\n');
  process.exitCode = 1;
});
