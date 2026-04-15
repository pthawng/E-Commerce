import { CheckCircle2, Clock, Package, Truck, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { OrderTimeline, OrderStatus } from '../types';

interface OrderTimelineViewProps {
  timelines: OrderTimeline[];
  currentStatus: OrderStatus;
}

export const OrderTimelineView: React.FC<OrderTimelineViewProps> = ({ timelines, currentStatus }) => {
  const { t, language } = useTranslation();
  const getIcon = (action: string, status?: OrderStatus | null) => {
    if (action.includes('CANCEL')) return <XCircle className="w-4 h-4 text-destructive" />;
    if (action.includes('PAYMENT_SUCCESS')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('PAYMENT_FAILED')) return <XCircle className="w-4 h-4 text-destructive" />;

    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gold-light" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-gold" />;
      case 'processing': return <Package className="w-4 h-4 text-primary/60" />;
      case 'shipping': return <Truck className="w-4 h-4 text-blue-400" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const sortedTimelines = [...timelines].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-primary/5">
      {sortedTimelines.map((event, index) => (
        <div key={event.id} className="relative group">
          {/* Timeline Dot/Icon */}
          <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-surface border border-primary/5 flex items-center justify-center z-10 transition-colors duration-500 group-hover:border-primary/20">
            {getIcon(event.action, event.toStatus)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-ultra text-primary font-medium">
                {t(`account.orders.timeline.${event.action}`, { defaultValue: event.action.replace(/_/g, ' ') })}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {new Date(event.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground font-body italic transition-colors duration-500 group-hover:text-primary/70">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}

      {sortedTimelines.length === 0 && (
        <div className="flex items-center gap-3 text-muted-foreground italic text-xs py-4">
          <AlertCircle className="w-4 h-4 stroke-[1]" />
          <span>{t('account.orders.noTimelineFound')}</span>
        </div>
      )}
    </div>
  );
};
