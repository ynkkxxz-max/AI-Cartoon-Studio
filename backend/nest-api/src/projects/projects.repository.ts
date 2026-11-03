import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { Database } from '../database';
import { CreateProject, ListQuery, UpdateProject } from './validation';

function data(input: CreateProject | UpdateProject) {
  return {
    name: input.name, projectType: input.project_type ?? input.type,
    storyPrompt: input.story_prompt, durationPreset: input.duration_preset,
    resolution: input.resolution, style: input.style, languages: input.languages,
    selectedCharacters: input.selected_characters,
    metadata: input.metadata as Prisma.InputJsonObject | undefined,
  };
}

export function serialize(project: Project) {
  return {
    id: project.id, name: project.name, project_type: project.projectType,
    story_prompt: project.storyPrompt, duration_preset: project.durationPreset,
    resolution: project.resolution, style: project.style, languages: project.languages,
    selected_characters: project.selectedCharacters, metadata: project.metadata,
    status: project.archivedAt ? 'archived' : 'draft', pipeline_step: 0,
    version: project.version, created_at: project.createdAt.toISOString(), updated_at: project.updatedAt.toISOString(),
  };
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly db: Database) {}
  async create(ownerId: string, input: CreateProject) {
    return serialize(await this.db.project.create({ data: { ...data(input), name: input.name, ownerId } }));
  }
  async list(ownerId: string, query: ListQuery) {
    return (await this.db.project.findMany({
      where: { ownerId, archivedAt: null, ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}) },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: query.limit, skip: query.offset,
    })).map(serialize);
  }
  find(ownerId: string, id: string) { return this.db.project.findFirst({ where: { id, ownerId, archivedAt: null } }); }
  async update(ownerId: string, id: string, input: UpdateProject) {
    // updateManyAndReturn gives atomic owner/version scoping and the exact updated row.
    const rows = await this.db.project.updateManyAndReturn({
      where: { id, ownerId, archivedAt: null, version: input.version },
      data: { ...data(input), version: { increment: 1 } },
    });
    return rows[0] ? serialize(rows[0]) : null;
  }
  async archive(ownerId: string, id: string, version: number) {
    return (await this.db.project.updateMany({
      where: { id, ownerId, archivedAt: null, version },
      data: { archivedAt: new Date(), version: { increment: 1 } },
    })).count;
  }
}
