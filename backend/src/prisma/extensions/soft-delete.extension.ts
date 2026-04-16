import { Prisma } from '@prisma/client';

/**
 * Soft Delete Extension for Prisma
 * Automatically filters out records where deletedAt is not null.
 * 
 * ⚠️ WARNING: This extension DO NOT apply to raw SQL ($queryRaw).
 * For raw queries, you MUST manually append "deletedAt IS NULL".
 * 
 * Usage:
 * const prisma = new PrismaClient().$extends(softDeleteExtension);
 */
export const softDeleteExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // List of models that have a deletedAt field
                    const softDeleteModels = [
                        'User',
                        'Role',
                        'Product',
                        'ProductVariant',
                        // Add other models here as they adopt the deletedAt pattern
                    ];

                    if (model && softDeleteModels.includes(model)) {
                        // Only inject for read operations that support where
                        const readOperations = [
                            'findFirst',
                            'findFirstOrThrow',
                            'findUnique',
                            'findUniqueOrThrow',
                            'findMany',
                            'count',
                            'aggregate',
                            'groupBy',
                        ];

                        if (readOperations.includes(operation)) {
                            (args as any).where = { ...(args as any).where, deletedAt: null };
                        }
                    }

                    return query(args);
                },
            },
        },
    });
});
