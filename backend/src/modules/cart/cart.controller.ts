import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, RefreshCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { JwtAccessGuard } from 'src/modules/auth/guard/access-jwt.guard';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    // -------------------------
    // 1. GET CART (Hybrid)
    // -------------------------
    @Get()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiHeader({ name: 'x-client-session-id', description: 'Session ID for Guest', required: false })
    @ApiOperation({ summary: 'Get cart (Supports both User & Guest)' })
    getCart(
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.cartService.getCart(req.user?.userId, sessionId);
    }

    // -------------------------
    // 2. ADD TO CART
    // -------------------------
    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiHeader({ name: 'x-client-session-id', description: 'Session ID for Guest', required: false })
    @ApiOperation({ summary: 'Add product to cart' })
    addToCart(
        @Body() dto: AddToCartDto,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.cartService.addToCart(req.user?.userId, sessionId, dto);
    }

    // -------------------------
    // 3. UPDATE ITEM
    // -------------------------
    @Patch('items/:variantId')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Update item quantity' })
    updateItem(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: UpdateCartItemDto,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.cartService.updateItem(req.user?.userId, sessionId, variantId, dto);
    }

    // -------------------------
    // 4. REMOVE ITEM
    // -------------------------
    @Delete('items/:variantId')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({ summary: 'Remove item from cart' })
    removeItem(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.cartService.removeItem(req.user?.userId, sessionId, variantId);
    }

    // -------------------------
    // 5. MERGE (Guest -> User)
    // -------------------------
    @Post('merge')
    @UseGuards(JwtAccessGuard) // Login required to merge
    @ApiBearerAuth()
    @ApiHeader({ name: 'x-client-session-id', description: 'Session ID to merge', required: true })
    @ApiOperation({ summary: 'Merge Guest Cart into User Cart after login' })
    mergeCart(
        @Req() req: { user: RequestUserPayload },
        @CurrentSession() sessionId: string,
    ) {
        return this.cartService.mergeCart(req.user.userId, sessionId);
    }

    // -------------------------
    // 6. REFRESH PRICES
    // -------------------------
    @Post('refresh')
    @UseGuards(OptionalJwtAuthGuard)
    @HttpCode(200)
    @ApiOperation({ summary: 'Refresh cart prices (if prices changed)' })
    refreshCart(
        @Req() req: { user?: RequestUserPayload },
        @CurrentSession() sessionId?: string,
    ) {
        return this.cartService.refreshCartPrices(req.user?.userId, sessionId);
    }
}
