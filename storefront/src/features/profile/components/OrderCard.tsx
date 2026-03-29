import React from 'react';
import { format } from 'date-fns';
import { Package, ChevronRight, MapPin, User, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { getApiBaseUrl } from '@shared';
import { Order } from '../types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = getApiBaseUrl();
    const baseUrl = backendUrl.split('/api')[0];
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const statusColors: Record<string, string> = {

    pending: 'text-gold-light border-gold-light/20 bg-gold-shimmer/10',
    confirmed: 'text-gold border-gold/20 bg-gold-shimmer/20',
    shipping: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    delivered: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    completed: 'text-primary/60 border-primary/10 bg-primary/5',
    cancelled: 'text-destructive border-destructive/20 bg-destructive/5',
    failed: 'text-destructive border-destructive/20 bg-destructive/5',
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const items = order.items || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-surface-container-lowest border border-primary/5 shadow-luxury hover:shadow-luxury-hover transition-all duration-500 p-8 sm:p-10"
    >
      <div className="flex flex-col md:flex-row justify-between gap-8">
        {/* Order Header Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-[9px] uppercase tracking-ultra border ${statusColors[order.status] || 'text-muted-foreground border-primary/10'}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-display tracking-wide text-primary">
              Order #{order.code}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3 stroke-[1]" />
              <span className="text-[10px] uppercase tracking-widest">
                {(order.shippingAddress as any)?.city || 'International Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Item Thumbnails (Preview) */}
        <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar max-w-xs min-h-[80px]">
          {items.slice(0, 3).map((item) => {
            const displayThumbnail = item.thumbnailUrl || item.productVariant?.thumbnailUrl;
            
            return (
              <div key={item.id} className="relative w-16 h-20 bg-background border border-primary/5 overflow-hidden flex-shrink-0">
                {displayThumbnail ? (
                  <img 
                    src={resolveImageUrl(displayThumbnail) || ''} 
                    alt={item.productName} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/10">
                    <Package className="w-6 h-6 stroke-[1]" />
                  </div>
                )}
              </div>
            );
          })}
          {items.length > 3 && (
            <div className="w-16 h-20 bg-primary/5 flex items-center justify-center text-[10px] text-primary/60 uppercase tracking-widest font-body border border-primary/5">
              +{items.length - 3}
            </div>
          )}
        </div>


        {/* Total & Action */}
        <div className="flex flex-col justify-between items-end gap-6 md:min-w-[180px]">
          <div className="text-right space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-ultra">Total Investment</p>
            <p className="text-2xl font-display text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
            </p>
          </div>
          
          <Link 
            to={`/account/orders/${order.id}`}
            className="group/btn flex items-center gap-3 text-[10px] tracking-ultra uppercase text-primary/60 hover:text-primary transition-colors duration-500"
          >
            <span>View Manifest</span>
            <div className="w-8 h-px bg-primary/20 group-hover/btn:w-12 group-hover/btn:bg-primary transition-all duration-500" />
            <ChevronRight className="w-3 h-3 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
