import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    mode: 'light';
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (_set) => ({
            mode: 'light',
        }),
        {
            name: 'theme-storage',
        }
    )
);
