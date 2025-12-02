import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';

@Module({
  providers: [RbacService, PermissionGuard, PrismaService, Reflector],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
