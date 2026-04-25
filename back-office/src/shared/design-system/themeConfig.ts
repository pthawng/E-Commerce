import { ThemeConfig } from 'antd';

// Primary Brand Colors
const BRAND_NAVY = "#0e2258";

export const lightTheme: ThemeConfig = {
    token: {
        colorPrimary: BRAND_NAVY,
        colorInfo: BRAND_NAVY,
        borderRadius: 2,
        fontFamily: "'Inter', sans-serif",
        colorBgBase: "#ffffff",
        colorTextBase: "#0a0a0a",
        colorTextSecondary: "#525252",
        colorTextDescription: "#737373",
        colorError: "#e11d48",
        colorWarning: "#d97706",
    },
    components: {
        Layout: {
            headerBg: "#ffffff",
            siderBg: "#ffffff",
        },
        Typography: {
            colorTextHeading: "#000000",
            fontWeightStrong: 700,
        },
        Statistic: {
            titleFontSize: 12,
            contentFontSize: 32,
        },
        Table: {
            headerBg: "#fcfcfc",
            headerColor: "#000000",
            headerSplitColor: "transparent",
            headerBorderRadius: 0,
        },
        Menu: {
            itemSelectedBg: "rgba(14, 34, 88, 0.05)",
            itemSelectedColor: BRAND_NAVY,
            itemHoverColor: BRAND_NAVY,
        }
    }
};
