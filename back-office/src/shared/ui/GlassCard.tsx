import React from 'react';
import { Card, type CardProps } from 'antd';
import styles from './GlassCard.module.css';
import clsx from 'clsx';

export const GlassCard: React.FC<CardProps> = ({ className, ...props }) => {
    return (
        <Card 
            className={clsx(styles.glassCard, className)} 
            {...props} 
        />
    );
};
