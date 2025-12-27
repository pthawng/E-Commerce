import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { apiPost } from '@/services/apiClient';
import { API_ENDPOINTS, type AuthResponse, type User } from '@shared';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { toast } from 'sonner';

type AuthMode = 'login' | 'register' | 'forgot';

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8);
const nameSchema = z.string().trim().min(2);

const sanitizeInput = (input: string): string => {
  return input.replace(/<[^>]*>/g, '').trim();
};

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cross-dissolve with vertical slide
const formVariants = {
  enter: {
    opacity: 0,
    y: 10,
  },
  center: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

export function AuthSheet({ open, onOpenChange }: AuthSheetProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { login } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time confirm password validation (only for register mode)
  useEffect(() => {
    if (mode !== 'register') {
      // clear confirm error when not in register mode
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
      return;
    }

    // if confirm is empty, don't show mismatch error
    if (!confirmPassword) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmPassword;
        return next;
      });
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (password !== confirmPassword) {
        next.confirmPassword = t.auth.errors.passwordMismatch;
      } else {
        delete next.confirmPassword;
      }
      return next;
    });
  }, [password, confirmPassword, mode, t]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const sanitizedEmail = sanitizeInput(email);
    if (!emailSchema.safeParse(sanitizedEmail).success) {
      newErrors.email = t.auth.errors.invalidEmail;
    }

    if (mode !== 'forgot') {
      if (!passwordSchema.safeParse(password).success) {
        newErrors.password = t.auth.errors.passwordLength;
      }
    }

    if (mode === 'register') {
      const sanitizedName = sanitizeInput(name);
      if (!nameSchema.safeParse(sanitizedName).success) {
        newErrors.name = t.auth.errors.nameRequired;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t.auth.errors.passwordMismatch;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      if (errors.password) setPassword('');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mode === 'login') {
      try {
        const sanitizedEmail = sanitizeInput(email);
        const resp = await apiPost<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email: sanitizedEmail, password });
        const authData = resp.data;
        if (authData && authData.user && authData.tokens) {
          // Normalize user shape to shared User type
          const normalizedUser: User = {
            id: authData.user.id,
            email: authData.user.email,
            fullName: authData.user.fullName,
            phone: authData.user.phone,
            isActive: authData.user.isActive,
            isEmailVerified: authData.user.isEmailVerified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          useAuthStore.getState().setAuth(normalizedUser, authData.tokens);
          // Update public store for UI
          const displayName = normalizedUser.fullName || sanitizedEmail;
          login(displayName, normalizedUser.email || sanitizedEmail);
          toast.success(t.auth.loginSuccess);
          onOpenChange(false);
          resetForm();
        } else {
          throw new Error('Invalid auth response');
        }
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'Login failed';
        toast.error(message);
      }
    } else if (mode === 'register') {
      try {
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        const payload = {
          email: sanitizedEmail,
          password,
          fullName: sanitizedName,
        };
        const resp = await apiPost<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
        const data = resp.data;
        if (data && data.user && data.tokens) {
          const normalizedUser: User = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
            phone: data.user.phone,
            isActive: data.user.isActive,
            isEmailVerified: data.user.isEmailVerified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          useAuthStore.getState().setAuth(normalizedUser, data.tokens);
          const displayName = normalizedUser.fullName || normalizedUser.email;
          login(displayName, normalizedUser.email);
          toast.success(t.auth.registerSuccess);
          onOpenChange(false);
          resetForm();
        } else {
          // Backend might just return success message without auth
          toast.success(t.auth.registerSuccess);
          switchMode('login');
        }
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message || 'Register failed';
        toast.error(message);
      }
    } else {
      toast.success(t.auth.resetEmailSent);
      switchMode('login');
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setErrors({});
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[380px] md:w-[400px] p-0 bg-background border-l-0 overflow-y-auto"
      >
        {/* Hairline border */}
        <div className="absolute top-0 left-0 bottom-0 w-px">
          <div className="hairline-vertical" />
        </div>

        {/* Header */}
        <div className="px-10 pt-16 pb-10">
          <motion.div 
            className="w-8 h-px bg-primary/40 mb-8"
            initial={{ width: 0 }}
            animate={{ width: 32 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          
          <motion.h2 
            className="font-display text-sm tracking-ultra text-primary uppercase font-normal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Ray Paradis
          </motion.h2>
          <motion.p 
            className="font-serif text-xs text-muted-foreground mt-3 tracking-wide italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Where Dreams Become Masterpieces
          </motion.p>
        </div>

        {/* Content */}
        <div className="px-10 pb-32 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Title */}
              <div className="mb-10">
                <h3 className="font-display text-2xl text-foreground tracking-wide font-normal">
                  {mode === 'login' && t.auth.login}
                  {mode === 'register' && t.auth.register}
                  {mode === 'forgot' && t.auth.forgotPassword}
                </h3>
                <p className="text-muted-foreground font-body text-xs mt-3 leading-relaxed tracking-wide">
                  {mode === 'login' && t.auth.loginSubtitle}
                  {mode === 'register' && t.auth.registerSubtitle}
                  {mode === 'forgot' && t.auth.forgotSubtitle}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name field */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label htmlFor="name" className="text-muted-foreground text-2xs font-body tracking-ultra uppercase">
                        {t.auth.fullName}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.auth.namePlaceholder}
                        className="input-luxury h-10 text-sm font-body placeholder:text-muted-foreground/40"
                      />
                      {errors.name && (
                        <motion.p 
                          className="text-2xs text-destructive font-body"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-muted-foreground text-2xs font-body tracking-ultra uppercase">
                    {t.auth.email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="input-luxury h-10 text-sm font-body placeholder:text-muted-foreground/40"
                  />
                  {errors.email && (
                    <motion.p 
                      className="text-2xs text-destructive font-body"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <AnimatePresence>
                  {mode !== 'forgot' && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label htmlFor="password" className="text-muted-foreground text-2xs font-body tracking-ultra uppercase">
                        {t.auth.password}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.auth.passwordPlaceholder}
                          className="input-luxury h-10 text-sm font-body placeholder:text-muted-foreground/40 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground/50 hover:text-foreground transition-colors duration-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.2} /> : <Eye className="w-4 h-4" strokeWidth={1.2} />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p 
                          className="text-2xs text-destructive font-body"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm Password */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-muted-foreground text-2xs font-body tracking-ultra uppercase">
                        {t.auth.confirmPassword}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t.auth.confirmPasswordPlaceholder}
                        className="input-luxury h-10 text-sm font-body placeholder:text-muted-foreground/40"
                      />
                      {errors.confirmPassword && (
                        <motion.p 
                          className="text-2xs text-destructive font-body"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-2xs text-muted-foreground hover:text-foreground transition-colors duration-500 font-body tracking-wide"
                    >
                      {t.auth.forgotPasswordLink}
                    </button>
                  </div>
                )}

                {/* Submit */}
                <motion.div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || (mode === 'register' && !!errors.confirmPassword)}
                    variant="luxury"
                    className="w-full h-12 text-2xs tracking-ultra"
                  >
                    <span>
                      {isLoading ? (
                        <span className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.2} />
                          {t.auth.loading}
                        </span>
                      ) : (
                        <>
                          {mode === 'login' && t.auth.loginButton}
                          {mode === 'register' && t.auth.registerButton}
                          {mode === 'forgot' && t.auth.resetButton}
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              </form>

              {/* Switch mode (moved to sticky footer area) */}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Switch-mode area (normal flow, sits above footer) */}
        <div className="mt-4 px-10 pb-4">
          <div className="hairline mb-3" />
          <div className="text-center">
            <span className="text-2xs text-muted-foreground font-body tracking-wide">
              {mode === 'login' ? t.auth.noAccount : mode === 'register' ? t.auth.hasAccount : t.auth.rememberPassword}
            </span>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-2xs text-foreground hover:text-primary transition-colors duration-500 font-body tracking-wide inline-flex items-center gap-1 group"
            >
              {mode === 'login' ? t.auth.registerLink : t.auth.loginLink}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" strokeWidth={1.2} />
            </button>
          </div>
        </div>

        {/* Footer (static) */}
        <div className="px-10 py-6">
          <div className="hairline mb-6" />
          <p className="text-center text-2xs text-muted-foreground/50 font-body tracking-wide">
            © 2025 Ray Paradis
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}


