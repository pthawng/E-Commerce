import { Public } from '@common/decorators/public.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { setAuthCookies } from './utils/auth-cookie.helper';

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
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginAdmin(dto);
    setAuthCookies(req, res, result.tokens);
    return result;
  }
}
