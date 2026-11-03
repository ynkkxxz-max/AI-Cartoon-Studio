import 'reflect-metadata';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { json } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { CONFIG, Config } from './config';
import { OwnerGuard, OwnerRequest } from './auth';
import { Database } from './database';
import { SafeErrors } from './errors';
import { HealthController } from './health';
import { ProjectsModule } from './projects/projects.module';

export async function createApp(config: Config, logging = true) {
  @Global()
  @Module({ providers: [{ provide: CONFIG, useValue: config }, Database], exports: [CONFIG, Database] })
  class InfrastructureModule {}
  @Module({
    imports: [InfrastructureModule, ProjectsModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: config.rateLimit }])],
    controllers: [HealthController],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: OwnerGuard }],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: logging ? ['error','warn','log'] : false });
  app.use((req: OwnerRequest, res: import('express').Response, next: () => void) => {
    req.requestId = randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('Cache-Control', 'no-store');
    if (logging) res.on('finish', () => process.stdout.write(JSON.stringify({ requestId: req.requestId, method: req.method, status: res.statusCode }) + '\n'));
    next();
  });
  app.use(helmet());
  app.enableCors({ origin: config.origins, methods: ['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type','If-Match'], exposedHeaders: ['X-Request-Id'], credentials: false });
  app.use(json({ limit: '256kb', strict: true }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new SafeErrors());
  app.enableShutdownHooks();
  await app.init();
  return app;
}
