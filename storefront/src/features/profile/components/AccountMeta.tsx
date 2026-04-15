import React from 'react';
import { UserProfile } from '../types';
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar, Clock } from 'lucide-react';

interface AccountMetaProps {
  user: UserProfile;
}

export const AccountMeta: React.FC<AccountMetaProps> = ({ user }) => {
  const { t, language } = useTranslation();

  const formatDate = (date: string | Date, includeTime = false) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : 'en-US', options);
  };

  return (
    <div className="flex flex-wrap gap-12 mt-16 pt-12 border-t border-primary/5">
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-primary/30 stroke-[1.2]" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-ultra text-muted-foreground">{t('account.labels.clientSince')}</span>
          <span className="text-sm font-body text-primary/70">
            {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {user.lastLoginAt && (
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary/30 stroke-[1.2]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-ultra text-muted-foreground">{t('account.labels.lastAccess')}</span>
            <span className="text-sm font-body text-primary/70">
              {formatDate(user.lastLoginAt, true)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
