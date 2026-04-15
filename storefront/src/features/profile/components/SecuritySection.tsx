import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { changePasswordSchema, ChangePasswordInput } from '../types';
import { useChangePassword } from '../hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export const SecuritySection: React.FC = () => {
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const { mutate: changePassword, isPending } = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => {
        setIsChanging(false);
        reset();
      },
    });
  };

  const PasswordInput = ({
    label,
    id,
    show,
    toggle,
    error,
    registerProps
  }: {
    label: string,
    id: string,
    show: boolean,
    toggle: () => void,
    error?: string,
    registerProps: any
  }) => (
    <div className="space-y-4">
      <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground/60">{label}</Label>
      <div className="relative group">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          {...registerProps}
          className="bg-transparent border-t-0 border-x-0 border-b border-primary/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all duration-700 font-body text-lg h-10 pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors p-2"
        >
          {show ? (
            <X className="w-4 h-4 stroke-[1.2]" /> // Symbolic close eye
          ) : (
            <Lock className="w-4 h-4 stroke-[1.2]" />
          )}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[9px] text-destructive uppercase tracking-widest"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <section className="bg-surface-container-lowest p-8 sm:p-12 shadow-luxury mt-8 border border-primary/5">
      <div className="flex items-center gap-4 mb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-display italic text-primary leading-tight">
            {t('account.sections.security')}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t('account.labels.manageAuth')}</p>
        </div>
        <ShieldCheck className="w-5 h-5 text-primary/20 stroke-[1.2] ml-auto" />
      </div>

      <div className="space-y-8">
        {!isChanging ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 py-6 border-t border-primary/5">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-ultra text-muted-foreground/60">{t('account.labels.currentPassword')}</Label>
              <p className="text-xl font-body text-primary/90 tracking-[0.5em]">••••••••</p>
            </div>
            <button
              onClick={() => setIsChanging(true)}
              className="text-[10px] tracking-ultra uppercase text-primary border-b border-primary/20 pb-1 hover:border-primary transition-all duration-500"
            >
              {t('account.actions.update')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 border-t border-primary/5 pt-10" />

              <PasswordInput
                label={t('account.labels.currentPassword')}
                id="currentPassword"
                show={showCurrent}
                toggle={() => setShowCurrent(!showCurrent)}
                error={errors.currentPassword?.message}
                registerProps={register('currentPassword')}
              />

              <div className="hidden md:block" />

              <PasswordInput
                label={t('account.labels.newPassword')}
                id="newPassword"
                show={showNew}
                toggle={() => setShowNew(!showNew)}
                error={errors.newPassword?.message}
                registerProps={register('newPassword')}
              />

              <PasswordInput
                label={t('account.labels.confirmPassword')}
                id="confirmPassword"
                show={showConfirm}
                toggle={() => setShowConfirm(!showConfirm)}
                error={errors.confirmPassword?.message}
                registerProps={register('confirmPassword')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-primary/5">
              <button
                type="submit"
                disabled={isPending}
                className="relative group px-10 py-3 bg-primary text-primary-foreground overflow-hidden transition-all duration-500"
              >

                <span className="relative z-10 text-[10px] tracking-ultra uppercase">
                  {isPending ? t('account.messages.processing') : t('account.actions.commitPassword')}
                </span>
                <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChanging(false);
                  reset();
                }}
                className="text-[10px] tracking-ultra uppercase text-primary/40 hover:text-primary transition-colors duration-500 border-b border-transparent hover:border-primary/20 pb-1"
              >
                {t('account.actions.maintainCurrent')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

