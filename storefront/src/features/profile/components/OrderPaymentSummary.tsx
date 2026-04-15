import { CreditCard, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Order } from '../types';

interface OrderPaymentSummaryProps {
  order: Order;
}

export const OrderPaymentSummary: React.FC<OrderPaymentSummaryProps> = ({ order }) => {
  const { t, formatPrice } = useTranslation();

  const isPendingPayment = order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && order.status !== 'failed';
  const isFailedPayment = order.status === 'failed' || (order.paymentStatus === 'unpaid' && order.status === 'pending_payment');

  return (
    <div className="bg-surface-container-lowest border border-primary/5 shadow-luxury p-8 sm:p-10 space-y-10">
      <h3 className="text-[10px] uppercase tracking-ultra text-primary/40 pb-4 border-b border-primary/5">{t('account.orders.financialSummary')}</h3>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-body italic">{t('account.orders.subtotal')}</span>
          <span className="text-primary font-body tracking-wider">{formatPrice(order.subTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground font-body italic">{t('account.orders.shippingFee')}</span>
          <span className="text-primary font-body tracking-wider">{formatPrice(order.shippingFee)}</span>
        </div>
        {order.discountAmount && order.discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gold-light font-body italic">{t('account.orders.privilege')}</span>
            <span className="text-gold-light font-body tracking-wider">-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="pt-6 border-t border-primary/5 flex justify-between items-baseline">
          <span className="text-[10px] uppercase tracking-ultra text-primary/80">{t('account.orders.totalInvestment')}</span>
          <span className="text-2xl font-display text-primary">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      <div className="pt-6 border-t border-primary/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-primary/40 stroke-[1]" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t('account.orders.method', { method: order.paymentMethod || t('account.orders.creditPortfolio') })}
            </span>
          </div>
          <span className={`text-[9px] uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-gold-light'}`}>
            {t(`account.orders.paymentStatus.${order.paymentStatus}`)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          {isPendingPayment && (
            <button className="w-full group relative bg-primary text-primary-foreground py-4 px-6 overflow-hidden transition-all duration-500 hover:shadow-luxury-hover">
              <span className="relative z-10 flex items-center justify-center gap-3 text-[10px] tracking-ultra uppercase">
                {t('account.actions.continue')}
                <ArrowRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-luxury" />
            </button>
          )}

          {isFailedPayment && (
            <button className="w-full group relative bg-background border border-destructive/30 text-destructive py-4 px-6 overflow-hidden transition-all duration-500">
              <span className="relative z-10 flex items-center justify-center gap-3 text-[10px] tracking-ultra uppercase">
                {t('account.actions.retry')}
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-700" />
              </span>
              <div className="absolute inset-0 bg-destructive/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-luxury" />
            </button>
          )}

          <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest italic pt-2">
            {t('account.orders.secureGateway')}
          </p>
        </div>
      </div>
    </div>
  );
};
