import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useCartStore } from '@/features/cart/store/useCartStore';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_email_required: 'Your social account did not provide an email address.',
  oauth_link_required: 'Please sign in with email first, then link this social account.',
  oauth_state_invalid: 'The sign-in session expired. Please try again.',
  oauth_invalid_callback: 'The sign-in response was invalid. Please try again.',
  oauth_access_denied: 'This sign-in method is not allowed for that account.',
  oauth_failed: 'Social sign-in failed. Please try again.',
};

export function OAuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const mergeOnLogin = useCartStore((state) => state.mergeOnLogin);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus = params.get('oauth');
    const oauthError = params.get('oauth_error');

    if (!oauthStatus && !oauthError) return;

    params.delete('oauth');
    params.delete('oauth_error');
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
        hash: location.hash,
      },
      { replace: true },
    );

    if (oauthStatus === 'success') {
      void (async () => {
        await fetchUser();
        await mergeOnLogin();
        toast.success('Welcome back to Ray Paradis.');
      })();
      return;
    }

    if (oauthError) {
      toast.error(ERROR_MESSAGES[oauthError.toLowerCase()] || ERROR_MESSAGES.oauth_failed);
    }
  }, [fetchUser, location.hash, location.pathname, location.search, mergeOnLogin, navigate]);

  return null;
}
