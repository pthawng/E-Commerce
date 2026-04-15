import { AsyncLocalStorage } from 'async_hooks';

/**
 * SystemContextStore
 *
 * Tracks the execution context using AsyncLocalStorage.
 * Used to enforce system invariants at runtime (e.g., ensuring
 * inventory mutations only happen via InventoryService).
 */
export class SystemContextStore {
  private static readonly storage = new AsyncLocalStorage<Map<string, any>>();

  static run<T>(context: Map<string, any>, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  static get isInternalService(): boolean {
    const store = this.storage.getStore();
    return store?.get('isInternalService') === true;
  }

  static setInternalService(value: boolean): void {
    const store = this.storage.getStore();
    if (store) {
      store.set('isInternalService', value);
    }
  }

  static get caller(): string | undefined {
    const store = this.storage.getStore();
    return store?.get('caller');
  }

  static setCaller(name: string): void {
    const store = this.storage.getStore();
    if (store) {
      store.set('caller', name);
    }
  }

  /**
   * Helper to execute a function with an internal service context.
   */
  static async asInternal<T>(callerName: string, fn: () => Promise<T>): Promise<T> {
    const currentStore = this.storage.getStore();
    const store = currentStore || new Map<string, any>();

    store.set('isInternalService', true);
    store.set('caller', callerName);

    if (currentStore) {
      return fn();
    }

    return this.storage.run(store, fn);
  }
}
