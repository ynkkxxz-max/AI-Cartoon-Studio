import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository, serialize } from './projects.repository';
import { CreateProject, ListQuery, UpdateProject } from './validation';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}
  create(owner: string, input: CreateProject) { return this.repository.create(owner, input); }
  list(owner: string, query: ListQuery) { return this.repository.list(owner, query); }
  async get(owner: string, id: string) {
    const project = await this.repository.find(owner, id);
    if (!project) throw new NotFoundException('Project not found');
    return serialize(project);
  }
  async update(owner: string, id: string, input: UpdateProject) {
    const project = await this.repository.update(owner, id, input);
    if (project) return project;
    await this.get(owner, id);
    throw new ConflictException('Project changed; reopen it before saving');
  }
  async archive(owner: string, id: string, version: number) {
    if (await this.repository.archive(owner, id, version)) return;
    await this.get(owner, id);
    throw new ConflictException('Project changed; reopen it before deleting');
  }
}
