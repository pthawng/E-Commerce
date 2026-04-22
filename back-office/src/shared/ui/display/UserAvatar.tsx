import React from 'react';
import { Avatar } from 'antd';
import type { AvatarProps } from 'antd';
import { colors } from '@/shared/design-system/colors';
import { typography } from '@/shared/design-system/typography';

interface UserAvatarProps extends AvatarProps {
    fullName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ fullName, src, style, ...props }) => {
    // Generate initials from fullName (Up to 2 characters)
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 1).toUpperCase();
    };

    const initials = getInitials(fullName || '');
    const normalizedSrc = src || undefined;

    // Compute dynamic font size based on avatar size
    const baseSize = typeof props.size === 'number' ? props.size : 36;
    const fontSize = baseSize * 0.45;

    // "Jewel" Fallback Styling with Silk Depth
    const fallbackStyle: React.CSSProperties = {
        background: `radial-gradient(circle at 30% 30%, ${colors.primary.lighter} 0%, ${colors.primary.main} 100%)`,
        color: colors.secondary.light, // Brighter gold for shimmer
        fontFamily: typography.fontFamily.serif,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        border: `1.5px solid ${colors.secondary.main}`,
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4), 0 4px 12px rgba(11, 37, 69, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.02em',
        ...style
    };

    // If we have an image, we still want the gold border to maintain "Luxury Admin" identity
    const imageStyle: React.CSSProperties = {
        border: `1.5px solid ${colors.secondary.main}`,
        boxShadow: '0 4px 12px rgba(11, 37, 69, 0.2)',
        background: colors.neutral[100],
        ...style
    };

    return (
        <Avatar
            src={normalizedSrc}
            style={normalizedSrc ? imageStyle : fallbackStyle}
            {...props}
        >
            {!normalizedSrc && initials}
        </Avatar>
    );
};
