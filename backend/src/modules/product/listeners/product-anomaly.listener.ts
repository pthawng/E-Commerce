import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemContextStore } from 'src/common/context/system-context.store';

@Injectable()
export class ProductAnomalyListener {
  private readonly logger = new Logger(ProductAnomalyListener.name);
  private readonly THRESHOLD = 1; // Giảm xuống 1 để bạn test nhanh (chuẩn production là 3+)
  private readonly WINDOW_MS = 60000; 
  
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  @OnEvent('product.media.anomaly_reported', { async: true })
  async handleMediaAnomaly(payload: { productId: string; mediaUrl: string; clientId: string }) {
    const { productId, clientId } = payload;
    this.logger.debug(`[Listener] Received anomaly report for product ${productId} from client ${clientId}`);
    const cacheKey = `anomaly:product:media:${productId}`;
    
    // Get existing reports
    let reports: string[] = await this.cacheManager.get(cacheKey) || [];
    
    // Add client if not exists to prevent single-user spam
    if (!reports.includes(clientId)) {
      reports.push(clientId);
      await this.cacheManager.set(cacheKey, reports, this.WINDOW_MS);
    }

    if (reports.length >= this.THRESHOLD) {
      this.logger.warn(`Anomaly Threshold breached for product ${productId}. Auto-hiding...`);
      await this.autoHideProduct(productId, payload.mediaUrl);
      // Reset cache to avoid spamming notifications
      await this.cacheManager.del(cacheKey);
    }
  }

  private async autoHideProduct(productId: string, mediaUrl: string) {
    await SystemContextStore.asInternal('ProductAnomalyListener', async () => {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) return;

      // 1. Hide product
      await this.prisma.product.update({
        where: { id: productId },
        data: { isActive: false }
      });

      // 2. Create Alert Notification for Admin
      const productName = (product.name as any)?.vi || (product.name as any)?.en || product.slug;
      
      await this.prisma.notification.create({
        data: {
          type: 'ERROR',
          priority: 'CRITICAL',
          title: 'Product Auto-Hidden: Broken Media',
          content: `Sản phẩm [${productName}] đã bị ẩn tự động do nhiều người dùng báo cáo lỗi tải ảnh trên Storefront.`,
          metadata: { 
            productId, 
            mediaUrl,
            path: '/pim', // Deep link to Catalog
            actionLabel: 'Xem trong Catalog'
          }
        }
      });
      
      this.logger.error(`Product ${productId} auto-hidden and notification sent.`);
    });
  }
}
