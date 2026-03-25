import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { OrderPaymentService } from '../services/order-payment.service';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
    constructor(
        private readonly orderPaymentService: OrderPaymentService,
    ) { }

    @Post('validate')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Step 1: Validate cart and generate checkout token',
        description: 'Binds the current cart state and ownership to a secure token.' 
    })
    @ApiResponse({ status: 200, description: 'Checkout validated' })
    async validateCheckout(
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.orderPaymentService.validateCheckout(
            req.user?.userId,
            sessionId,
        );
    }
}
