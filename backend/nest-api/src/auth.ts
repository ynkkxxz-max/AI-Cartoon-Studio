import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { CONFIG, Config } from './config';

export const Public = () => SetMetadata('public', true);
export type OwnerRequest = Request & { ownerId: string; requestId: string };

@Injectable()
export class OwnerGuard implements CanActivate {
  private readonly keys: { ownerId: string; digest: Buffer }[];
  constructor(@Inject(CONFIG) config: Config, private readonly reflector: Reflector) {
    this.keys = config.keys.map(k => ({ ownerId: k.ownerId, digest: this.digest(k.token) }));
  }
  private digest(value: string) { return createHash('sha256').update(value).digest(); }
  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride('public', [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest<OwnerRequest>();
    const header = req.headers.authorization ?? '';
    if (!/^Bearer [^\s]{32,256}$/.test(header)) throw new UnauthorizedException('Authentication required');
    const digest = this.digest(header.slice(7));
    let owner: string | undefined;
    for (const key of this.keys) if (timingSafeEqual(digest, key.digest)) owner = key.ownerId;
    if (!owner) throw new UnauthorizedException('Authentication required');
    req.ownerId = owner;
    return true;
  }
}
