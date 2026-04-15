import { SystemContextStore } from '../context/system-context.store';

/**
 * SystemAction Decorator (L8 pattern)
 * 
 * Automatically wraps a method in SystemContextStore.asInternal context.
 * Useful for Cron jobs, Queue processors, and other background tasks
 * that need administrative database mutation rights.
 * 
 * @param callerName Optional caller name for audit logging
 */
export function SystemAction(callerName?: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const name = callerName || `${target.constructor.name}.${propertyKey}`;
            return SystemContextStore.asInternal(name, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}
