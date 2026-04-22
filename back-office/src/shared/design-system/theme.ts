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
        colorBorder: colors.border.default,
        colorBorderSecondary: colors.border.subtle,

        // Typography
        fontFamily: typography.fontFamily.sans,
        fontSize: 14,
        lineHeight: 1.5,

        // Shape
        borderRadius: parseInt(radius.sm),

        // Shadow
        boxShadow: shadows.md,
        boxShadowSecondary: shadows.sm,
    },
    components: {
        Layout: {
            bodyBg: colors.background.body,
            headerBg: colors.background.surface,
            siderBg: colors.background.sidebar,
            headerHeight: 64,
            headerPadding: '0 24px',
        },
        Menu: {
            // Sidebar Theme (Dark)
            itemBg: 'transparent',
            itemColor: 'rgba(255, 255, 255, 0.65)',
            itemSelectedColor: '#FFFFFF',
            itemSelectedBg: 'rgba(197, 160, 101, 0.08)', // Gold tint
            itemActiveBg: 'rgba(255, 255, 255, 0.05)',
            itemHoverColor: '#FFFFFF',
            itemHoverBg: 'rgba(255, 255, 255, 0.04)',
            groupTitleColor: 'rgba(255, 255, 255, 0.4)',
            groupTitleFontSize: 10,
            // Interaction Contract
            motionDurationMid: '150ms', // Align with transition contract
            // Popup
            popupBg: colors.background.surface,
        },
        Table: {
            headerBg: '#F8FAFC',
            headerColor: colors.neutral[600],
            headerBorderRadius: 0,
            rowHoverBg: 'rgba(197, 160, 101, 0.04)',
            borderColor: colors.border.subtle,
            headerSplitColor: 'transparent',
            cellPaddingInline: 16,
            cellPaddingBlock: 16,
            fontSize: 14,
        },
        Card: {
            headerBg: 'transparent',
            boxShadow: shadows.sm,
            headerFontSize: 16,
            paddingLG: 24,
            borderRadiusLG: 8,
            colorBorderSecondary: 'transparent', // Borderless feel
        },
        Button: {
            controlHeight: 40,
            paddingInline: 20,
            borderRadius: 6,
            primaryShadow: 'none',
            defaultShadow: 'none',
            colorLink: colors.primary.main,
            colorLinkHover: colors.primary.light,
        },
        Input: {
            controlHeight: 40,
            paddingInline: 12,
            borderRadius: 6,
            colorBorder: colors.border.default,
            hoverBorderColor: colors.secondary.main,
            activeBorderColor: colors.secondary.main,
            activeShadow: '0 0 0 2px rgba(197, 160, 101, 0.1)',
        },
        Select: {
            controlHeight: 40,
            borderRadius: 6,
        },
        Tag: {
            borderRadius: 4,
        },
        Badge: {
            colorError: colors.error.main,
        },
        Typography: {
            fontFamilyCode: typography.fontFamily.mono,
            colorTextHeading: colors.primary.main,
        }
    },
};
