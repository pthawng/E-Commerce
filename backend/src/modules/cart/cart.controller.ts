import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentSession } from 'src/common/decorators/current-session.decorator';
import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RequestUserPayload } from 'src/common/types/jwt.types';
import { JwtAccessGuard } from 'src/modules/auth/guard/access-jwt.guard';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  // -------------------------
  // 1. GET CART (Hybrid)
  // -------------------------
  @Get()
  @OptionalAuth()
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-client-session-id', description: 'Session ID for Guest', required: false })
  @ApiOperation({ summary: 'Get cart (Supports both User & Guest)' })
  getCart(@Req() req: { user?: RequestUserPayload }, @CurrentSession() sessionId?: string) {
    return this.cartService.getCart(req.user?.userId, sessionId);
  }

  // -------------------------
  // 2. ADD TO CART
  // -------------------------
  @Post()
  @OptionalAuth()
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
  @OptionalAuth()
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
  @OptionalAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @Param('variantId', new ParseUUIDPipe()) variantId: string,
    @Req() req: { user?: RequestUserPayload },
    @CurrentSession() sessionId?: string,
    @Query('version') version?: number,
  ) {
    return this.cartService.removeItem(
      req.user?.userId,
      sessionId,
      variantId,
      version ? Number(version) : undefined,
    );
  }

  // -------------------------
  // 5. MERGE (Guest -> User)
  // -------------------------
  @Post('merge')
  @UseGuards(JwtAccessGuard) // Login required to merge
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-client-session-id', description: 'Session ID to merge', required: true })
  @ApiOperation({ summary: 'Merge Guest Cart into User Cart after login' })
  mergeCart(@Req() req: { user: RequestUserPayload }, @CurrentSession() sessionId: string) {
    return this.cartService.mergeCart(req.user.userId, sessionId);
  }

  // -------------------------
  // 6. REFRESH PRICES
  // -------------------------
  @Post('refresh')
  @OptionalAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh cart prices (if prices changed)' })
  refreshCart(@Req() req: { user?: RequestUserPayload }, @CurrentSession() sessionId?: string) {
    return this.cartService.refreshCartPrices(req.user?.userId, sessionId);
  }

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get global cart configuration (shipping thresholds, etc.)' })
  getCartConfig() {
    return this.cartService.getCartConfig();
  }
}
