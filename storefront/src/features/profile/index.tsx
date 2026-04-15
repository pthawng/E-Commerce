import React from 'react';
import { ProfileLayout } from './components/ProfileLayout';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { useTranslation } from '@/hooks/useTranslation';
import { SecuritySection } from './components/SecuritySection';
import { AccountMeta } from './components/AccountMeta';
import { useProfile } from './hooks/useProfile';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

export const ProfileFeature: React.FC = () => {
  const { t } = useTranslation();
  const { data: user, isLoading, error, refetch } = useProfile();
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Redirect to login if not authenticated (basic check)
  React.useEffect(() => {
    if (!authUser && !isLoading) {
      navigate('/login');
    }
  }, [authUser, isLoading, navigate]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const profileData = user?.data;

  if (error || !profileData) {
    return (
      <div className="bg-surface-container-lowest py-32 px-10 text-center shadow-luxury flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-16 h-px bg-destructive/30 mb-8" />
        <h2 className="text-3xl font-display italic text-primary/80 mb-6">{t('account.errors.connection')}</h2>
        <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto mb-12 leading-relaxed">
          {t('account.errors.connectionDesc')}
        </p>
        <button
          onClick={() => refetch()}
          className="group relative px-8 py-3 overflow-hidden"
        >
          <span className="relative z-10 text-[10px] tracking-ultra uppercase text-primary group-hover:text-gold transition-colors duration-500">
            {t('account.actions.retry')}
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary/20 group-hover:bg-gold transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold group-hover:w-full transition-all duration-700 ease-in-out" />
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <ProfileInfoCard user={profileData} />
      <SecuritySection />
      <AccountMeta user={profileData} />
    </div>
  );
};



export default ProfileFeature;
