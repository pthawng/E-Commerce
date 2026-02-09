import * as tokens from '@/ui/design-tokens';

interface VIPBadgeProps {
    size?: 'small' | 'medium';
}

export function VIPBadge({ size = 'medium' }: VIPBadgeProps) {
    const isSmall = size === 'small';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: isSmall ? 11 : 12,
            fontWeight: 600,
            padding: isSmall ? '2px 8px' : '3px 10px',
            borderRadius: 3,
            backgroundColor: '#F5F0E8',
            color: '#8B7355',
            border: '1px solid #E8DCC8',
            letterSpacing: '0.02em',
        }}>
            <span style={{ fontSize: isSmall ? 10 : 11 }}>★</span>
            VIP
        </span>
    );
}
