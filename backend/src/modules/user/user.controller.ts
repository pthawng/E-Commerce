import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@modules/rbac/decorators/permission.decorator';
import { PermissionGuard } from '@modules/rbac/guards/rbac.guard';
import { PERMISSIONS } from '@modules/rbac/permissions.constants';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(PermissionGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  // CREATE USER
  @Post()
  @ApiOperation({ summary: 'Tạo mới user' })
  @ApiResponse({ status: 201, description: 'Tạo user thành công' })
  @Permission(PERMISSIONS.AUTH.USER.CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET ALL USERS
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả user (không phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách user' })
  @Permission(PERMISSIONS.AUTH.USER.READ)
  findAll() {
    return this.userService.findAll();
  }

  // GET ALL USERS (PAGINATED)
  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách user (có phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách user kèm meta phân trang' })
  @Permission(PERMISSIONS.AUTH.USER.READ)
  findAllUserPaginated(@Query() dto: PaginationDto) {
    return this.userService.findAllUserPaginated(dto);
  }

  // GET USER BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Lấy user theo ID' })
  @ApiResponse({ status: 200, description: 'User chi tiết' })
  @Permission(PERMISSIONS.AUTH.USER.READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.findOne(id);
  }

  // UPDATE USER
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin user' })
  @ApiResponse({ status: 200, description: 'User sau khi cập nhật' })
  @Permission(PERMISSIONS.AUTH.USER.UPDATE)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  // SOFT DELETE USER
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm user' })
  @ApiResponse({ status: 200, description: 'Kết quả xóa mềm' })
  @Permission(PERMISSIONS.AUTH.USER.DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.softDelete(id);
  }
}
