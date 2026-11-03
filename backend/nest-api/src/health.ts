import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from './auth';
import { Database } from './database';

@Controller('health')
export class HealthController {
  constructor(private readonly db: Database) {}
  @Public()
  @Get()
  live() { return { status: 'ok', service: 'ai-cartoon-studio-api' }; }
  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.db.$queryRaw`SELECT 1`;
      // Check the migrated application table, not just the database connection.
      await this.db.project.count({ where: { id: '00000000-0000-4000-8000-000000000000' } });
      return { status: 'ok', database: 'up' };
    } catch { throw new ServiceUnavailableException('Database unavailable'); }
  }
}
