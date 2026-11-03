import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CONFIG, Config } from './config';

@Injectable()
export class Database extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(CONFIG) config: Config) {
    super({ datasources: { db: { url: config.databaseUrl } }, log: [] });
  }
  async onModuleDestroy() { await this.$disconnect(); }
}
