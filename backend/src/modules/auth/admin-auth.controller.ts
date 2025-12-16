import { Public } from '@common/decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Admin Authentication')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập back-office' })
  @ApiOkResponse({ description: 'Đăng nhập admin thành công' })
  @ApiUnauthorizedResponse({
    description: 'Thông tin đăng nhập không đúng hoặc không có quyền admin',
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }
}
