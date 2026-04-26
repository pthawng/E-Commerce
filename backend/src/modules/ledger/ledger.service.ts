import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReconciliationStatus } from '@prisma/client';

@Injectable()
export class LedgerService {
    private readonly logger = new Logger(LedgerService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get balances for all items in the 'materials' category.
     */
    async getMaterialBalances() {
        const materialItems = await this.prisma.inventoryItem.findMany({
            where: {
                productVariant: {
                    product: {
                        categories: {
                            some: {
                                category: {
                                    slug: 'materials',
                                },
                            },
                        },
                    },
                },
            },
            include: {
                productVariant: {
                    include: {
                        product: true,
                    },
                },
                warehouse: true,
            },
        });

        return materialItems.map((item) => {
            const nameObj = item.productVariant?.product?.name as any;
            const displayName = nameObj?.vi || nameObj?.en || Object.values(nameObj || {})[0] || 'Unknown Material';

            const variantTitleObj = item.productVariant?.variantTitle as any;
            const displayVariantTitle = variantTitleObj?.vi || variantTitleObj?.en || Object.values(variantTitleObj || {})[0] || '';

            return {
                id: item.id,
                sku: item.productVariant?.sku || 'N/A',
                name: displayName,
                variantTitle: displayVariantTitle,
                quantity: item.quantity || 0,
                reserved: item.reservedQuantity || 0,
                available: (item.quantity || 0) - (item.reservedQuantity || 0),
                warehouse: item.warehouse?.name || 'Unknown Warehouse',
                lastUpdated: item.updatedAt,
                costPrice: Number(item.productVariant?.costPrice || item.productVariant?.price || 0),
            };
        });
    }

    /**
     * Get recent financial transactions for reconciliation.
     */
    async getFinancialFlows(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.paymentTransaction.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    order: {
                        include: {
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.paymentTransaction.count(),
        ]);

        return {
            items,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Calculate strategic Ledger KPIs.
     */
    async getLedgerKPIs() {
        // 1. Total Material Asset Value
        const materialItems = await this.prisma.inventoryItem.findMany({
            where: {
                productVariant: {
                    product: {
                        categories: { some: { category: { slug: 'materials' } } },
                    },
                },
            },
            include: {
                productVariant: true,
            },
        });

        const totalMaterialValue = materialItems.reduce((sum, item) => {
            if (!item.productVariant) return sum;
            const price = Number(item.productVariant.costPrice || item.productVariant.price || 0);
            return sum + price * (item.quantity || 0);
        }, 0);

        // 2. Unverified Revenue
        const unverifiedTransactions = await this.prisma.paymentTransaction.aggregate({
            where: {
                status: 'success',
                reconciliationStatus: ReconciliationStatus.UNVERIFIED,
            },
            _sum: {
                amount: true,
            },
        });

        // 3. Recent Discrepancies
        const discrepancyCount = await this.prisma.paymentTransaction.count({
            where: {
                reconciliationStatus: ReconciliationStatus.MISMATCH,
            },
        });

        return {
            totalMaterialValue,
            unverifiedRevenue: Number(unverifiedTransactions?._sum?.amount || 0),
            activeDiscrepancies: discrepancyCount || 0,
        };
    }

    /**
     * Update the reconciliation status of a transaction.
     */
    async reconcileTransaction(transactionId: string, status: ReconciliationStatus) {
        const transaction = await this.prisma.paymentTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        return this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: {
                reconciliationStatus: status,
            },
        });
    }

    /**
     * Elite Forensic Audit Engine
     * Scans all orders and verifies their payment integrity.
     */
    async runForensicAudit() {
        this.logger.log('Starting deep forensic audit of financial flows...');

        // 1. Fetch all successful orders with their successful transactions
        const orders = await this.prisma.order.findMany({
            where: {
                status: {
                    notIn: ['CANCELLED', 'PENDING_PAYMENT'] as any,
                },
            },
            include: {
                payments: {
                    where: { status: 'SUCCESS' },
                },
                transactions: {
                    where: { status: 'success' },
                },
            },
        });

        let issuesFound = 0;
        const details: string[] = [];

        for (const order of orders as any[]) {
            const totalPaid = order.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const expected = Number(order.totalAmount);

            // Mismatch detection
            if (Math.abs(totalPaid - expected) > 0.01) {
                issuesFound++;
                const reason = `Mismatch: Order ${order.code} expected ${expected}, but found ${totalPaid} in successful transactions.`;
                details.push(reason);

                // Update all transactions of this order to MISMATCH
                await this.prisma.paymentTransaction.updateMany({
                    where: { orderId: order.id },
                    data: { reconciliationStatus: ReconciliationStatus.MISMATCH },
                });
            } else {
                // Auto-match if everything is fine
                await this.prisma.paymentTransaction.updateMany({
                    where: {
                        orderId: order.id,
                        reconciliationStatus: ReconciliationStatus.UNVERIFIED,
                    },
                    data: { reconciliationStatus: ReconciliationStatus.MATCHED },
                });
            }
        }

        this.logger.log(`Forensic audit complete. Issues found: ${issuesFound}`);

        return {
            status: issuesFound > 0 ? 'WARNING' : 'HEALTHY',
            issuesFound,
            details,
            timestamp: new Date(),
        };
    }
}
