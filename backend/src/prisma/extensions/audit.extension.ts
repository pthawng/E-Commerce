import { Prisma } from '@prisma/client';

/**
 * Forensic Audit Logging Extension
 *
 * Automatically captures full JSON snapshots of state changes
 * for high-value entities.
 */
export const auditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const sensitiveModels = ['Order', 'InventoryBalance', 'Payment', 'Refund'];
          const auditOperations = ['update', 'delete', 'upsert'];

          if (model && sensitiveModels.includes(model) && auditOperations.includes(operation)) {
            // 1. Capture BEFORE state
            // We need to find the unique identifier for the record being modified
            const where = (args as any).where;
            let beforeState = null;

            if (where) {
              beforeState = await (client as any)[model].findUnique({ where });
            }

            // 2. Execute original mutation
            const result = await query(args);

            // 3. Capture AFTER state
            const afterState = operation === 'delete' ? null : result;

            // 4. Record Forensic Entry
            // Note: We use a separate non-extended client to avoid infinite loops
            await (client as any).auditLog.create({
              data: {
                entityTable: model,
                entityId: (result as any)?.id || (where as any)?.id || 'unknown',
                actorType: 'system',
                action: operation.toUpperCase(),
                resourceType: model,
                resourceId: (result as any)?.id || (where as any)?.id || 'unknown',
                before: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
                after: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
                metadata: {
                  ipAddress: 'internal-prisma',
                  userAgent: 'prisma-extension',
                },
              },
            });

            return result;
          }

          if (model && sensitiveModels.includes(model) && operation === 'create') {
            const result = await query(args);

            await (client as any).auditLog.create({
              data: {
                entityTable: model,
                entityId: (result as any)?.id || 'unknown',
                actorType: 'system',
                action: 'CREATE',
                resourceType: model,
                resourceId: (result as any)?.id || 'unknown',
                before: null,
                after: JSON.parse(JSON.stringify(result)),
                metadata: {
                  ipAddress: 'internal-prisma',
                  userAgent: 'prisma-extension',
                },
              },
            });

            return result;
          }

          return query(args);
        },
      },
    },
  });
});
