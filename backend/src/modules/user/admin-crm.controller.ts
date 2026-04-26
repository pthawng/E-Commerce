import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminJwtAccessGuard } from '@modules/auth/guard/admin-access-jwt.guard';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { UserService } from './user.service';

@ApiTags('admin-crm')
@Controller('admin/crm')
@UseGuards(AdminJwtAccessGuard, PermissionGuard)
export class AdminCRMController {
    constructor(private readonly userService: UserService) { }

    @Get('guests')
    @Permission(PERMISSIONS.CRM.GUEST.READ)
    findAllGuests(@Query() query: any) {
        return this.userService.findAllGuestCustomersPaginated(query);
    }

    @Get('stats')
    @Permission('rbac:users:read')
    getStats() {
        return this.userService.getPatronStrategicStats();
    }
}
