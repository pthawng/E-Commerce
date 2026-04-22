import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    theme: 'light' | 'dark';
    language: 'en-US' | 'vi-VN';
    currency: 'USD' | 'VND';
    compactMode: boolean;
    notifications: {
        emailSummaries: boolean;
        operationalAlerts: boolean;
    };

    // Actions
    setTheme: (theme: 'light' | 'dark') => void;
    setLanguage: (lang: 'en-US' | 'vi-VN') => void;
    setCurrency: (currency: 'USD' | 'VND') => void;
    toggleCompactMode: () => void;
    updateNotifications: (updates: Partial<SettingsState['notifications']>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'light',
            language: 'en-US',
            currency: 'USD',
            compactMode: false,
            notifications: {
                emailSummaries: true,
                operationalAlerts: true,
            },

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setCurrency: (currency) => set({ currency }),
            toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
            updateNotifications: (updates) => set((state) => ({
                notifications: { ...state.notifications, ...updates }
            })),
        }),
        {
            name: 'app-settings',
        }
    )
);
