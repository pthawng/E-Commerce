import 'i18next';
import vi from './locales/vi.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: typeof vi;
        };
    }
}
