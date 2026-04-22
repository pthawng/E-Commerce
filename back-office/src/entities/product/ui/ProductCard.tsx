import { Card, Typography } from 'antd';
import { ProductStatusBadge } from './ProductStatusBadge';
import type { Product } from '../model/types';
import clsx from 'clsx';
import styles from './ProductCard.module.css';

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
    const productName = typeof product.name === 'string'
        ? product.name
        : ((product.name as any)?.[locale] || Object.values(product.name || {})[0] || 'Unknown Product');
    const productDesc = typeof product.description === 'string'
        ? product.description
        : ((product.description as any)?.[locale] || Object.values(product.description || {})[0] || '');

    return (
        <Card
            hoverable
            cover={
                <div className={styles.imageContainer}>
                    <img
                        alt={productName}
                        src={imageUrl}
                        className={styles.image}
                    />
                </div>
            }
            onClick={() => onClick?.(product)}
            className={clsx(styles.card, className)}
            styles={{ body: { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' } }}
        >
            <div className={styles.header}>
                <Title level={5} className={styles.title} title={productName}>
                    {productName}
                </Title>
                <ProductStatusBadge status={product.isActive ? 'active' : 'inactive'} />
            </div>

            <Text type="secondary" className={styles.description}>
                {productDesc}
            </Text>

            <div className={styles.footer}>
                <Text strong className={styles.price}>
                    {product.displayPriceMin ? `${product.displayPriceMin.toLocaleString()}đ` : 'Contact for price'}
                </Text>
                <Text type="secondary" className={styles.slug}>
                    {product.slug}
                </Text>
            </div>
        </Card>
    );
};
