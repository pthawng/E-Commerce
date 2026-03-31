import { useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * ZodLocalizer component handles global Zod error message localization.
 * It stays in sync with the current application language.
 */
export const ZodLocalizer = () => {
  const { t, language } = useTranslation();

  useEffect(() => {
    const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
      // 1. Required / Empty field
      if (issue.code === z.ZodIssueCode.invalid_type) {
        if (issue.received === 'undefined' || issue.received === 'null' || (issue.received === 'string' && ctx.data === '')) {
          return { message: t('common.validation.required') };
        }
      }

      // 2. String validations (email, etc.)
      if (issue.code === z.ZodIssueCode.invalid_string) {
        if (issue.validation === 'email') {
          return { message: t('common.validation.email') };
        }
      }

      // 3. Minimum length
      if (issue.code === z.ZodIssueCode.too_small) {
        if (issue.type === 'string') {
          return { message: t('common.validation.min', { min: issue.minimum.toString() }) };
        }
      }

      // 4. Maximum length
      if (issue.code === z.ZodIssueCode.too_big) {
        if (issue.type === 'string') {
          return { message: t('common.validation.max', { max: issue.maximum.toString() }) };
        }
      }

      // 5. Explicit required for enums/selects
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: t('common.validation.select') };
      }

      // Fallback to default
      return { message: ctx.defaultError };
    };

    z.setErrorMap(customErrorMap);
  }, [language, t]);

  return null;
};
