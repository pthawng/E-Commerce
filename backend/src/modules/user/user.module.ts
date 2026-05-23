import { RbacModule } from '@modules/rbac/rbac.module';
import { AdminCRMController } from '@modules/user/admin-crm.controller';
import { AdminUserController } from '@modules/user/admin-user.controller';
import { UserController } from '@modules/user/user.controller';
import { UserService } from '@modules/user/user.service';
import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PaginationModule, RbacModule],
  controllers: [UserController, AdminUserController, AdminCRMController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
