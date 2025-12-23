import { Test, TestingModule } from '@nestjs/testing';
import { VariantPolicy } from './variant.policy';
import { PolicyAction } from 'src/modules/abac/types/policy.types';
import type { PolicyContext } from 'src/modules/abac/types/policy.types';
import type { RequestUserPayload } from '@common/types/jwt.types';

/**
 * Variant Policy Unit Tests
 * 
 * Test suite cho VariantPolicy với các scenarios khác nhau
 */
describe('VariantPolicy', () => {
    let policy: VariantPolicy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [VariantPolicy],
        }).compile();

        policy = module.get<VariantPolicy>(VariantPolicy);
    });

    describe('Authentication', () => {
        it('should deny unauthenticated users', async () => {
            const context: PolicyContext = {
                user: null as any,
                action: PolicyAction.READ,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Unauthenticated');
        });

        it('should deny users without userId', async () => {
            const context: PolicyContext = {
                user: { roles: [], permissions: [] } as any,
                action: PolicyAction.READ,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Unauthenticated');
        });
    });

    describe('Admin Bypass', () => {
        it('should allow admin to perform any action', async () => {
            const adminUser: RequestUserPayload = {
                userId: 'admin-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: [],
            };

            const actions = [
                PolicyAction.READ,
                PolicyAction.CREATE,
                PolicyAction.UPDATE,
                PolicyAction.DELETE,
            ];

            for (const action of actions) {
                const context: PolicyContext = {
                    user: adminUser,
                    action,
                };

                const result = await policy.evaluate(context);

                expect(result.allowed).toBe(true);
                expect(result.metadata?.bypassReason).toBe('Admin full access');
            }
        });
    });

    describe('MANAGE Permission Bypass', () => {
        it('should allow users with MANAGE permission to perform any action', async () => {
            const managerUser: RequestUserPayload = {
                userId: 'manager-123',
                email: 'manager@example.com',
                roles: ['product-manager'],
                permissions: ['product.variant.manage'],
            };

            const actions = [
                PolicyAction.READ,
                PolicyAction.CREATE,
                PolicyAction.UPDATE,
                PolicyAction.DELETE,
            ];

            for (const action of actions) {
                const context: PolicyContext = {
                    user: managerUser,
                    action,
                };

                const result = await policy.evaluate(context);

                expect(result.allowed).toBe(true);
                expect(result.metadata?.bypassReason).toBe('Has MANAGE permission');
            }
        });
    });

    describe('READ Action', () => {
        it('should allow staff to read variants', async () => {
            const staffUser: RequestUserPayload = {
                userId: 'staff-123',
                email: 'staff@example.com',
                roles: ['staff'],
                permissions: ['product.variant.read'],
            };

            const context: PolicyContext = {
                user: staffUser,
                action: PolicyAction.READ,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
        });

        it('should deny users without READ permission', async () => {
            const user: RequestUserPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                roles: ['customer'],
                permissions: [],
            };

            const context: PolicyContext = {
                user,
                action: PolicyAction.READ,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Không có quyền xem variant');
        });

        it('should allow customer to read active variants', async () => {
            const customerUser: RequestUserPayload = {
                userId: 'customer-123',
                email: 'customer@example.com',
                roles: ['customer'],
                permissions: ['product.variant.read'],
            };

            const context: PolicyContext = {
                user: customerUser,
                action: PolicyAction.READ,
                resource: {
                    id: 'variant-123',
                    isActive: true,
                },
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
        });

        it('should deny customer to read inactive variants', async () => {
            const customerUser: RequestUserPayload = {
                userId: 'customer-123',
                email: 'customer@example.com',
                roles: ['customer'],
                permissions: ['product.variant.read'],
            };

            const context: PolicyContext = {
                user: customerUser,
                action: PolicyAction.READ,
                resource: {
                    id: 'variant-123',
                    isActive: false,
                },
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('không khả dụng');
        });
    });

    describe('CREATE Action', () => {
        it('should allow staff to create variants', async () => {
            const staffUser: RequestUserPayload = {
                userId: 'staff-123',
                email: 'staff@example.com',
                roles: ['staff'],
                permissions: ['product.variant.create'],
            };

            const context: PolicyContext = {
                user: staffUser,
                action: PolicyAction.CREATE,
                resource: {
                    sku: 'VAR-001',
                },
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
        });

        it('should deny users without CREATE permission', async () => {
            const user: RequestUserPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                roles: ['staff'],
                permissions: [],
            };

            const context: PolicyContext = {
                user,
                action: PolicyAction.CREATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Không có quyền tạo variant');
        });

        it('should deny users without staff/manager role', async () => {
            const customerUser: RequestUserPayload = {
                userId: 'customer-123',
                email: 'customer@example.com',
                roles: ['customer'],
                permissions: ['product.variant.create'],
            };

            const context: PolicyContext = {
                user: customerUser,
                action: PolicyAction.CREATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Chỉ nhân viên');
        });

        it('should deny creating variant without SKU', async () => {
            const staffUser: RequestUserPayload = {
                userId: 'staff-123',
                email: 'staff@example.com',
                roles: ['staff'],
                permissions: ['product.variant.create'],
            };

            const context: PolicyContext = {
                user: staffUser,
                action: PolicyAction.CREATE,
                resource: {
                    sku: null,
                },
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('SKU là bắt buộc');
        });
    });

    describe('UPDATE Action', () => {
        it('should allow staff to update variants', async () => {
            const staffUser: RequestUserPayload = {
                userId: 'staff-123',
                email: 'staff@example.com',
                roles: ['staff'],
                permissions: ['product.variant.update'],
            };

            const context: PolicyContext = {
                user: staffUser,
                action: PolicyAction.UPDATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
        });

        it('should deny users without UPDATE permission', async () => {
            const user: RequestUserPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                roles: ['staff'],
                permissions: [],
            };

            const context: PolicyContext = {
                user,
                action: PolicyAction.UPDATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Không có quyền cập nhật variant');
        });

        it('should allow inventory-manager to update with warning', async () => {
            const inventoryUser: RequestUserPayload = {
                userId: 'inventory-123',
                email: 'inventory@example.com',
                roles: ['inventory-manager'],
                permissions: ['product.variant.update'],
            };

            const context: PolicyContext = {
                user: inventoryUser,
                action: PolicyAction.UPDATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
            expect(result.metadata?.restrictedFields).toContain('stock');
            expect(result.metadata?.warning).toContain('stock-related fields');
        });

        it('should allow manager to update without restrictions', async () => {
            const managerUser: RequestUserPayload = {
                userId: 'manager-123',
                email: 'manager@example.com',
                roles: ['manager'],
                permissions: ['product.variant.update'],
            };

            const context: PolicyContext = {
                user: managerUser,
                action: PolicyAction.UPDATE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
            expect(result.metadata?.restrictedFields).toBeUndefined();
        });
    });

    describe('DELETE Action', () => {
        it('should allow manager to delete variants', async () => {
            const managerUser: RequestUserPayload = {
                userId: 'manager-123',
                email: 'manager@example.com',
                roles: ['manager'],
                permissions: ['product.variant.delete'],
            };

            const context: PolicyContext = {
                user: managerUser,
                action: PolicyAction.DELETE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(true);
        });

        it('should deny users without DELETE permission', async () => {
            const user: RequestUserPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                roles: ['manager'],
                permissions: [],
            };

            const context: PolicyContext = {
                user,
                action: PolicyAction.DELETE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Không có quyền xóa variant');
        });

        it('should deny staff to delete variants', async () => {
            const staffUser: RequestUserPayload = {
                userId: 'staff-123',
                email: 'staff@example.com',
                roles: ['staff'],
                permissions: ['product.variant.delete'],
            };

            const context: PolicyContext = {
                user: staffUser,
                action: PolicyAction.DELETE,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Chỉ manager');
        });
    });

    describe('Unsupported Actions', () => {
        it('should deny unsupported actions', async () => {
            const user: RequestUserPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                roles: ['staff'],
                permissions: ['product.variant.read'],
            };

            const context: PolicyContext = {
                user,
                action: 'UNSUPPORTED_ACTION' as any,
            };

            const result = await policy.evaluate(context);

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('không được hỗ trợ');
        });
    });
});
