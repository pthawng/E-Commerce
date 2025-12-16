import { UserController } from '@modules/user/user.controller';
import { UserService } from '@modules/user/user.service';
import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from '@modules/rbac/rbac.module';

@Module({
  imports: [PrismaModule, PaginationModule, RbacModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
