import React from 'react';
import { ProfileLayout } from './components/ProfileLayout';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { SecuritySection } from './components/SecuritySection';
import { AccountMeta } from './components/AccountMeta';
import { useProfile } from './hooks/useProfile';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

export const ProfileFeature: React.FC = () => {
  const { data: user, isLoading, error } = useProfile();
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Redirect to login if not authenticated (basic check)
  React.useEffect(() => {
    if (!authUser && !isLoading) {
      navigate('/login');
    }
  }, [authUser, isLoading, navigate]);

  if (isLoading) {
    return (
      <ProfileLayout>
        <ProfileSkeleton />
      </ProfileLayout>
    );
  }

  const profileData = user?.data;

  if (error || !profileData) {
    return (
      <ProfileLayout>
        <div className="bg-surface-container-lowest p-20 text-center shadow-luxury">
          <h2 className="text-2xl font-display italic text-destructive mb-4">Unavailable</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto mb-8">
            We are unable to retrieve your profile information at this moment. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[10px] tracking-ultra uppercase text-primary border-b border-primary/20 pb-1 hover:border-primary transition-all"
          >
            Retry Connection
          </button>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="space-y-8">
        <ProfileInfoCard user={profileData} />
        <SecuritySection />
        <AccountMeta user={profileData} />
      </div>
    </ProfileLayout>
  );
};


export default ProfileFeature;
