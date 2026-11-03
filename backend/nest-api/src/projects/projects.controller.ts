import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, HttpException, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { OwnerRequest } from '../auth';
import { ProjectsService } from './projects.service';
import { CreateProject, createSchema, ListQuery, listSchema, UpdateProject, updateSchema, Validate } from './validation';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Post()
  create(@Req() req: OwnerRequest, @Body(new Validate(createSchema)) input: CreateProject) { return this.service.create(req.ownerId, input); }
  @Get()
  list(@Req() req: OwnerRequest, @Query(new Validate(listSchema)) query: ListQuery) { return this.service.list(req.ownerId, query); }
  @Get(':id')
  get(@Req() req: OwnerRequest, @Param('id', new ParseUUIDPipe()) id: string) { return this.service.get(req.ownerId, id); }
  @Patch(':id')
  update(@Req() req: OwnerRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body(new Validate(updateSchema)) input: UpdateProject) { return this.service.update(req.ownerId, id, input); }
  @Delete(':id')
  @HttpCode(204)
  archive(@Req() req: OwnerRequest, @Param('id', new ParseUUIDPipe()) id: string, @Headers('if-match') match?: string) {
    if (!match) throw new HttpException('If-Match version required', 428);
    if (!/^"[1-9]\d{0,8}"$/.test(match)) throw new BadRequestException('If-Match must be a quoted positive version, e.g. "1"');
    return this.service.archive(req.ownerId, id, Number(match.slice(1, -1)));
  }
}
