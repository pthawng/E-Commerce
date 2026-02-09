import * as tokens from '@/ui/design-tokens';

interface CustomerTagProps {
    label: string;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    onRemove?: () => void;
}

const TAG_COLORS = {
    default: {
        bg: '#F5F5F5',
        text: '#666',
        border: '#E5E5E5',
    },
    primary: {
        bg: '#EBF1F5',
        text: '#5A7A8C',
        border: '#D1DEE6',
    },
    success: {
        bg: '#EDF5ED',
        text: '#5A7A5A',
        border: '#D5E5D5',
    },
    warning: {
        bg: '#F5F0E8',
        text: '#8B7355',
        border: '#E8DCC8',
    },
    danger: {
        bg: '#F5EDED',
        text: '#8C5A5A',
        border: '#E6D5D5',
    },
};

export function CustomerTag({ label, color = 'default', onRemove }: CustomerTagProps) {
    const colorScheme = TAG_COLORS[color];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            padding: '3px 10px',
            borderRadius: 3,
            backgroundColor: colorScheme.bg,
            color: colorScheme.text,
            border: `1px solid ${colorScheme.border}`,
        }}>
            {label}
            {onRemove && (
                <button
                    onClick={onRemove}
                    style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 10,
                        color: colorScheme.text,
                        opacity: 0.6,
                        transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                >
                    ×
                </button>
            )}
        </span>
    );
}
