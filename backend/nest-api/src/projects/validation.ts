import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

const projectType = z.enum(['cartoon','video_editor','khmer_dubbing']);
const language = z.enum(['km','en','zh','zh-CN']).transform(v => v === 'zh' ? 'zh-CN' : v);
const fields = {
  name: z.string().trim().min(1).max(200),
  project_type: projectType.optional(),
  type: projectType.optional(),
  story_prompt: z.string().max(20000).optional(),
  duration_preset: z.string().trim().min(1).max(80).optional(),
  resolution: z.enum(['720p','1080p','4k']).optional(),
  style: z.string().trim().min(1).max(200).optional(),
  languages: z.array(language).min(1).max(3).refine(v => new Set(v).size === v.length, 'Languages must be unique').optional(),
  selected_characters: z.array(z.string().min(1).max(100)).max(100).refine(v => new Set(v).size === v.length, 'Characters must be unique').optional(),
  metadata: z.record(z.string(), z.json()).optional(),
};
const typesAgree = (v: {type?: string; project_type?: string}) => !v.type || !v.project_type || v.type === v.project_type;
export const createSchema = z.object(fields).strict().refine(typesAgree, 'type and project_type must agree');
export const updateSchema = z.object(fields).partial().extend({version: z.number().int().positive()}).strict()
  .refine(typesAgree, 'type and project_type must agree')
  .refine(v => Object.keys(v).length > 1, 'At least one changed field is required');
export const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  search: z.string().trim().max(200).optional(),
}).strict();
export type CreateProject = z.infer<typeof createSchema>;
export type UpdateProject = z.infer<typeof updateSchema>;
export type ListQuery = z.infer<typeof listSchema>;

export class Validate<T> implements PipeTransform {
  constructor(private readonly schema: z.ZodType<T>) {}
  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new BadRequestException(result.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`));
    return result.data;
  }
}
