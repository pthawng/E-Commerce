import { colors } from './colors';
import { typography } from './typography';

export const chartTheme = {
    xAxis: {
        tickLine: false,
        axisLine: false,
        tick: { fill: colors.neutral[400], fontSize: 11, fontFamily: typography.fontFamily.sans }
    },
    yAxis: {
        tickLine: false,
        axisLine: false,
        tick: { fill: colors.neutral[400], fontSize: 11, fontFamily: typography.fontFamily.sans }
    },
    grid: {
        strokeDasharray: "3 3",
        vertical: false,
        stroke: colors.border.subtle
    },
    tooltip: {
        contentStyle: {
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            fontFamily: typography.fontFamily.sans,
            fontSize: '12px',
            backgroundColor: '#FFFFFF'
        },
        itemStyle: {
            color: colors.primary.main,
            fontWeight: 600
        }
    },
    area: {
        strokeWidth: 2,
        fillOpacity: 1
    }
};

export const chartGradients = {
    primary: {
        id: 'colorPrimary',
        stops: [
            { offset: '5%', color: colors.primary.main, opacity: 0.15 },
            { offset: '95%', color: colors.primary.main, opacity: 0 }
        ]
    },
    gold: {
        id: 'colorGold',
        stops: [
            { offset: '5%', color: colors.secondary.main, opacity: 0.15 },
            { offset: '95%', color: colors.secondary.main, opacity: 0 }
        ]
    }
};
