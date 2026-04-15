/**
 * Access a nested property from an object using a string path (e.g., 'common.nav.collections')
 * Staff Fix: Added better protection and deep reduction.
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  if (!obj || !path) return undefined;
  const val = path.split('.').reduce((acc, part) => acc && acc[part], obj);
  return typeof val === 'string' ? val : undefined;
};

/**
 * Creates a Principal-grade translation function with multi-level fallback
 * and production-standard interpolation {{variable}}
 */
export const createTranslationFn = (
  currentTranslations: any,
  defaultTranslations: any,
  language: string,
  fallbackLng: string = 'en'
) => {
  return (key: string, variables?: Record<string, string | number>, defaultValue?: string): string => {
    // 1. Try to find in current translations
    let value = getNestedValue(currentTranslations, key);

    // 2. Fallback strategy (Critical Fix)
    // If key missing in current (e.g., zh), fallback to default (en)
    if (!value && language !== fallbackLng) {
      value = getNestedValue(defaultTranslations, key);
    }

    // 3. Last resort fallback
    if (!value) {
      return defaultValue || key;
    }

    // 4. Handle variable interpolation (Industry standard: {{name}})
    if (variables) {
      Object.entries(variables).forEach(([name, val]) => {
        // Matches both {var} and {{var}} for backward compatibility
        value = (value as string).replace(new RegExp(`{?{${name}}?}`, 'g'), String(val));
      });
    }

    return value as string;
  };
};
