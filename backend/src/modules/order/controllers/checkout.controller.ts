import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { OrderPaymentService } from '../services/order-payment.service';
import { ValidateCheckoutDto } from '../dto/validate-checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly orderPaymentService: OrderPaymentService) { }

  @Post('validate')
  @OptionalAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate cart and reserve stock before order creation',
    description: 'Step 1: Returns a checkoutToken and a snapshot of items/totals.',
  })
  @ApiResponse({ status: 200, description: 'Success returns checkoutToken and snapshot' })
  async validateCheckout(
    @Body() _dto: ValidateCheckoutDto, // Accept empty body {} to satisfy ValidationPipe
    @Req() req: { user?: RequestUserPayload },
    @CurrentSession() sessionId?: string,
  ) {
    return this.orderPaymentService.validateCheckout(req.user?.userId, sessionId);
  }
}
