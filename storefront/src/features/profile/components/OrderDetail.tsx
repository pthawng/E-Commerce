import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderDetail } from '../hooks/useOrders';
import { ProfileSkeleton } from './ProfileSkeleton';
import { OrderTimelineView } from '@/features/profile/components/OrderTimelineView';
import { OrderPaymentSummary } from '@/features/profile/components/OrderPaymentSummary';
import { OrderItemsTable } from '@/features/profile/components/OrderItemsTable';

import { ChevronLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderDetail: React.FC = () => {
  const { t, language } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading, error, refetch } = useOrderDetail(id!);

  const order = response?.data;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="bg-surface-container-lowest py-32 px-10 text-center shadow-luxury flex flex-col items-center justify-center animate-in fade-in duration-1000">
        <AlertCircle className="w-12 h-12 text-destructive/20 mb-8 stroke-[1]" />
        <h2 className="text-3xl font-display italic text-primary/80 mb-6">{t('account.orders.manifestNotFound')}</h2>
        <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto mb-12 leading-relaxed">
          {t('account.orders.manifestNotFoundDesc')}
        </p>
        <Link
          to="/account/orders"
          className="group relative px-8 py-3 overflow-hidden"
        >
          <span className="relative z-10 text-[10px] tracking-ultra uppercase text-primary group-hover:text-gold transition-colors duration-500">
            {t('account.orders.backToArchives')}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/20 group-hover:bg-gold transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-700 ease-in-out" />
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: t('account.orders.status.pending'), color: 'text-gold-light border-gold-light/20 bg-gold-shimmer/10' },
      confirmed: { label: t('account.orders.status.confirmed'), color: 'text-gold border-gold/30 bg-gold-shimmer/20' },
      processing: { label: t('account.orders.status.processing'), color: 'text-primary/70 border-primary/20 bg-primary/5' },
      shipping: { label: t('account.orders.status.shipping'), color: 'text-blue-500 border-blue-500/20 bg-blue-500/5' },
      delivered: { label: t('account.orders.status.delivered'), color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
      completed: { label: t('account.orders.status.completed'), color: 'text-primary/40 border-primary/10' },
      cancelled: { label: t('account.orders.status.cancelled'), color: 'text-destructive border-destructive/20 bg-destructive/5' },
      failed: { label: t('account.orders.status.failed'), color: 'text-destructive border-destructive/20 bg-destructive/5' },
    };
    const s = statusMap[status] || { label: status, color: 'text-muted-foreground border-primary/10' };
    return (
      <span className={`px-4 py-1 text-[9px] uppercase tracking-[0.25em] border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <header className="space-y-8">
        <Link
          to="/account/orders"
          className="group flex items-center gap-2 text-[10px] uppercase tracking-ultra text-muted-foreground hover:text-primary transition-colors duration-500"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-500 group-hover:-translate-x-1" />
          <span>{t('account.orders.backToArchives')}</span>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-display italic text-primary leading-tight">
              {t('account.orders.id', { code: order.code })}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              {t('account.orders.acquiredOn', { date: new Date(order.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </header>

      {/* Warning Banners */}
      <AnimatePresence>
        {order.status === 'failed' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-destructive/5 border border-destructive/20 p-6 flex items-start gap-4"
          >
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-body text-destructive font-medium mb-1 uppercase tracking-widest">{t('account.orders.transactionFailed')}</p>
              <p className="text-xs text-destructive/70 leading-relaxed italic">
                {order.cancelReason || t('account.orders.transactionFailedDesc')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        {/* Left Section: Details & Timeline */}
        <div className="lg:col-span-8 space-y-16">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-primary/5 pb-4">
              <h3 className="text-[10px] uppercase tracking-ultra text-primary/40">{t('account.orders.manifestItems')}</h3>
            </div>
            <OrderItemsTable items={order.items} />
          </section>

          <section className="space-y-12">
            <div className="flex items-center justify-between border-b border-primary/5 pb-4">
              <h3 className="text-[10px] uppercase tracking-ultra text-primary/40">{t('account.orders.acquisitionTimeline')}</h3>
            </div>
            <OrderTimelineView timelines={order.timelines} currentStatus={order.status} />
          </section>
        </div>

        {/* Right Section: Summary & Payment */}
        <aside className="lg:col-span-4 space-y-8">
          <OrderPaymentSummary order={order} />

          <div className="p-8 border border-primary/5 bg-primary/[0.02]">
            <h4 className="text-[10px] uppercase tracking-ultra text-primary/60 mb-6">{t('account.orders.shippingTo')}</h4>
            <div className="space-y-2 text-sm text-primary/70 font-body italic leading-relaxed">
              <p>{(order.shippingAddress as any)?.fullName}</p>
              <p>{(order.shippingAddress as any)?.address}</p>
              <p>{(order.shippingAddress as any)?.city}, {(order.shippingAddress as any)?.postalCode}</p>
              <p className="text-xs text-primary/40 not-italic mt-4">{(order.shippingAddress as any)?.phone}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
