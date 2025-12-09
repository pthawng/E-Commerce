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
} from '@nestjs/common';
import { PaginationDto } from 'src/common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // CREATE USER
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET ALL USERS
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // GET ALL USERS (PAGINATED)
  @Get('list')
  findAllUserPaginated(@Query() dto: PaginationDto) {
    return this.userService.findAllUserPaginated(dto);
  }

  // GET USER BY ID
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.findOne(id);
  }

  // UPDATE USER
  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  // SOFT DELETE USER
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.softDelete(id);
  }
}
