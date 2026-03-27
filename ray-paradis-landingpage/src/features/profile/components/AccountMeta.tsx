import React from 'react';
import { UserProfile } from '../types';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface AccountMetaProps {
  user: UserProfile;
}

export const AccountMeta: React.FC<AccountMetaProps> = ({ user }) => {
  return (
    <div className="flex flex-wrap gap-12 mt-16 pt-12 border-t border-primary/5">
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-primary/30 stroke-[1.2]" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-ultra text-muted-foreground">Private Client Since</span>
          <span className="text-sm font-body text-primary/70">
            {format(new Date(user.createdAt), 'MMMM do, yyyy')}
          </span>
        </div>
      </div>

      {user.lastLoginAt && (
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary/30 stroke-[1.2]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-ultra text-muted-foreground">Last Access</span>
            <span className="text-sm font-body text-primary/70">
              {format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
