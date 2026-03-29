import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="bg-surface-container-lowest p-10 shadow-luxury overflow-hidden">
        <div className="flex justify-between items-start mb-12">
          <Skeleton className="h-10 w-64 bg-primary/5 rounded-none" />
          <Skeleton className="h-8 w-8 bg-primary/5 rounded-none" />
        </div>
        <div className="space-y-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-3 w-24 bg-primary/5 rounded-none" />
              <Skeleton className="h-8 w-full bg-primary/5 rounded-none border-b border-primary/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest p-10 shadow-luxury overflow-hidden">
        <Skeleton className="h-10 w-48 mb-10 bg-primary/5 rounded-none" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-primary/5 rounded-none" />
            <Skeleton className="h-8 w-32 bg-primary/5 rounded-none" />
          </div>
          <Skeleton className="h-10 w-40 bg-primary/5 rounded-none" />
        </div>
      </div>
    </div>
  );
};
