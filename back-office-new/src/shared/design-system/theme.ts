import type { ThemeConfig } from 'antd';
import { colors } from './colors';
import { typography } from './typography';
import { radius } from './radius';
import { shadows } from './shadows';

export const themeConfig: ThemeConfig = {
    token: {
        // Colors
        colorPrimary: colors.primary.main,
        colorSuccess: colors.success.main,
        colorWarning: colors.warning.main,
        colorError: colors.error.main,
        colorInfo: colors.info.main,
        colorText: colors.neutral[900],
        colorTextSecondary: colors.neutral[600],
        colorTextTertiary: colors.neutral[400],
        colorBgBase: colors.background.body,
        colorBgContainer: colors.background.surface,

        // Typography
        fontFamily: typography.fontFamily.sans,
        fontSize: 14,

        // Shape
        borderRadius: parseInt(radius.sm),

        // Shadow
        boxShadow: shadows.md,
    },
    components: {
        Layout: {
            bodyBg: colors.background.body,
            headerBg: colors.background.surface,
            siderBg: colors.background.sidebar, // Use Navy Sidebar
        },
        Menu: {
            // Dark Theme for Sidebar usually
            itemBg: 'transparent',
            itemColor: colors.text.inverse, // White text on Navy
            itemSelectedColor: colors.secondary.main, // Gold text for active
            itemSelectedBg: 'rgba(255, 255, 255, 0.1)', // Subtle light bg for active
            itemHoverBg: 'rgba(255, 255, 255, 0.05)',
            itemHoverColor: colors.secondary.light,

            // Popup menus (light theme usually)
            popupBg: colors.background.surface,
        },
        Table: {
            headerBg: colors.neutral[50],
            headerColor: colors.neutral[600],
            rowHoverBg: colors.neutral[50],
            borderColor: colors.border.subtle,
            headerSplitColor: colors.border.subtle,
        },
        Card: {
            headerBg: 'transparent',
            boxShadow: shadows.sm,
            headerFontSize: 18,
        },
        Button: {
            controlHeight: 40,
            primaryShadow: 'none',
            defaultShadow: 'none',
            fontWeight: 500,
        },
        Input: {
            controlHeight: 40,
            colorBorder: colors.border.default,
            hoverBorderColor: colors.primary.light,
            activeBorderColor: colors.primary.main,
        },
        Typography: {
            fontFamilyCode: typography.fontFamily.mono,
        }
    },
};
