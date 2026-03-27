import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { ProfileLayout } from '../components/ProfileLayout';
import { OrderCard } from './OrderCard';
import { ProfileSkeleton } from './ProfileSkeleton';


export const OrderHistory: React.FC = () => {
  const { data: response, isLoading, error, refetch } = useOrders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-primary/5 animate-pulse rounded-none" />
        <ProfileSkeleton />
      </div>
    );
  }

  const orders = response?.data || [];

  if (error || !response?.success) {
    return (
      <div className="bg-surface-container-lowest py-32 px-10 text-center shadow-luxury flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-16 h-px bg-destructive/30 mb-8" />
        <h2 className="text-3xl font-display italic text-primary/80 mb-6">Connection Error</h2>
        <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto mb-12 leading-relaxed">
          We are unable to retrieve your order history at this moment.
        </p>
        <button 
          onClick={() => refetch()}
          className="group relative px-8 py-3 overflow-hidden"
        >
          <span className="relative z-10 text-[10px] tracking-ultra uppercase text-primary group-hover:text-gold transition-colors duration-500">
            Retry Protocol
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/20 group-hover:bg-gold transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-700 ease-in-out" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-1">
        <h1 className="text-4xl font-display italic text-primary leading-tight">
          Order History
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">View and track your previous acquisitions</p>
      </header>

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest py-32 px-10 text-center border border-primary/5 shadow-luxury flex flex-col items-center justify-center animate-in fade-in duration-1000">
          <ShoppingBag className="w-12 h-12 text-primary/10 mb-8 stroke-[1]" />
          <h2 className="text-2xl font-display italic text-primary/60 mb-6">The archives are empty</h2>
          <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto mb-12 leading-relaxed italic">
            You have not yet made any acquisitions with the Maison.
          </p>
          <a 
            href="/collections"
            className="group relative px-8 py-3 overflow-hidden"
          >
            <span className="relative z-10 text-[10px] tracking-ultra uppercase text-primary group-hover:text-gold transition-colors duration-500">
              Explore Collections
            </span>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/20 group-hover:bg-gold transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-700 ease-in-out" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

