import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CartService } from './modules/cart/cart.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const cartService = app.get(CartService);

    // Test for a potential sessionId (use a dummy one or find one from DB)
    const sessionId = 'test-session-123'; 
    
    console.log('--- FETCHING CART FOR TEST SESSION ---');
    const cart = await cartService.getCart(undefined, sessionId);
    console.log('Cart Response:', JSON.stringify(cart, null, 2));

    await app.close();
}

bootstrap();
