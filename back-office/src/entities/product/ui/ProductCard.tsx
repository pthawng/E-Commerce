import React from 'react';
import { Card, Typography } from 'antd';
import { ProductStatusBadge } from './ProductStatusBadge';
import type { Product } from '../model/types';
import clsx from 'clsx';

interface Props {
    product: Product;
    locale?: string;
    onClick?: (product: Product) => void;
    className?: string;
}

const { Title, Text } = Typography;

/**
 * Presentational Card for Product Entity
 */
export const ProductCard = ({ product, locale = 'vi', onClick, className }: Props) => {
    const fallbackImage = 'https://via.placeholder.com/300?text=No+Image';
    const imageUrl = product.media?.[0]?.url || fallbackImage;
    const productName = typeof product.name === 'string' ? product.name : (product.name?.[locale] || Object.values(product.name || {})[0] || 'Unknown Product');
    const productDesc = typeof product.description === 'string' ? product.description : (product.description?.[locale] || Object.values(product.description || {})[0] || '');

    return (
        <Card
            hoverable
            cover={
                <div className="h-48 overflow-hidden bg-gray-50">
                    <img 
                        alt={productName} 
                        src={imageUrl} 
                        className="w-full h-full object-cover transition-transform hover:scale-105" 
                    />
                </div>
            }
            onClick={() => onClick?.(product)}
            className={clsx("overflow-hidden flex flex-col h-full", className)}
            styles={{ body: { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' } }}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <Title level={5} className="!m-0 line-clamp-2 flex-1" title={productName}>
                    {productName}
                </Title>
                <ProductStatusBadge status={product.isActive ? 'active' : 'inactive'} />
            </div>
            
            <Text type="secondary" className="line-clamp-2 text-sm flex-1 mb-4 italic">
                {productDesc}
            </Text>
            
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <Text strong className="text-primary-600">
                    {product.displayPriceMin ? `${product.displayPriceMin.toLocaleString()}đ` : 'Contact for price'}
                </Text>
                <Text type="secondary" className="text-xs uppercase tracking-wider">
                    {product.slug}
                </Text>
            </div>
        </Card>
    );
};
