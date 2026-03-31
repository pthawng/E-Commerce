/**
 * Access a nested property from an object using a string path (e.g., 'nav.links.home')
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Creates a robust translation function with multi-level fallback
 * locale[key] -> defaultLocale[key] -> defaultValue -> key
 */
export const createTranslationFn = (
  currentTranslations: any,
  defaultTranslations: any,
  language: string
) => {
  return (key: string, variables?: Record<string, string | number>, defaultValue?: string): string => {
    // 1. Try to find in current translations
    let value = getNestedValue(currentTranslations, key);

    // 2. Fallback to default translations (e.g., 'en')
    if (!value && currentTranslations !== defaultTranslations) {
      value = getNestedValue(defaultTranslations, key);
    }

    // 3. Fallback to manual default value or key name itself
    if (!value) {
      return defaultValue || key;
    }

    // 4. Handle variable interpolation (e.g., {count} -> 5)
    if (variables) {
      Object.entries(variables).forEach(([name, val]) => {
        value = (value as string).replace(`{${name}}`, String(val));
      });
    }

    return value as string;
  };
};
