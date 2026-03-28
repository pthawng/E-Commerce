import React from 'react';
import { OrderItem } from '../types';
import { Package } from 'lucide-react';

interface OrderItemsTableProps {
  items: OrderItem[];
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const baseUrl = backendUrl.split('/api')[0];
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="space-y-8">
      {items.map((item) => {
        const displayThumbnail = item.thumbnailUrl || item.productVariant?.thumbnailUrl;
        
        return (
          <div key={item.id} className="group flex gap-8 items-center py-6 border-b border-primary/[0.03] last:border-0 transition-all duration-500 hover:bg-primary/[0.01]">
            {/* Thumbnail */}
            <div className="relative w-20 h-28 bg-background border border-primary/5 overflow-hidden flex-shrink-0">
              {displayThumbnail ? (
                <img 
                  src={resolveImageUrl(displayThumbnail) || ''} 
                  alt={item.productName} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/10">
                  <Package className="w-6 h-6 stroke-[1]" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white text-[8px] w-5 h-5 flex items-center justify-center rounded-full font-body z-10">
                {item.quantity}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-display text-primary/90 leading-tight group-hover:text-primary transition-colors duration-500">
                    {item.productName}
                  </h4>
                  <p className="text-[9px] uppercase tracking-ultra text-muted-foreground">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-body text-primary">{formatCurrency(item.price)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 italic">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
              
              {item.variantTitle && typeof item.variantTitle === 'object' && (
                <div className="flex gap-4">
                  {Object.entries(item.variantTitle).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">{key}</span>
                      <span className="text-[10px] uppercase tracking-widest text-primary/70 border border-primary/10 px-2 py-0.5 rounded-none">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
