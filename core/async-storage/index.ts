import { UserRole } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export type AsyncStorageData = {
  correlationId?: string;
  userId?: number;
  businessId?: number;
  userRole?: UserRole;
};

/**
 *
 **/
class AsyncStorage {
  private static asyncLocalStorage = AsyncStorage.initialize();

  private constructor() {}

  private static initialize(): AsyncLocalStorage<AsyncStorageData> {
    this.asyncLocalStorage = new AsyncLocalStorage<AsyncStorageData>();
    this.asyncLocalStorage.enterWith({ correlationId: undefined });
    return this.asyncLocalStorage;
  }

  public static setCorrelationId(id: string): void {
    this.asyncLocalStorage.run(this.asyncLocalStorage.getStore(), () => {
      this.asyncLocalStorage.getStore().correlationId = id;
    });
  }

  public static setUserId(id: number): void {
    this.asyncLocalStorage.run(this.asyncLocalStorage.getStore(), () => {
      this.asyncLocalStorage.getStore().userId = id;
    });
  }

  public static setBusinessId(id: number): void {
    this.asyncLocalStorage.run(this.asyncLocalStorage.getStore(), () => {
      this.asyncLocalStorage.getStore().businessId = id;
    });
  }

  public static setUserRole(role: UserRole): void {
    this.asyncLocalStorage.run(this.asyncLocalStorage.getStore(), () => {
      this.asyncLocalStorage.getStore().userRole = role;
    });
  }

  public static getCorrelationId() {
    return this.asyncLocalStorage.getStore()?.correlationId;
  }

  public static get(key: keyof AsyncStorageData) {
    return this.asyncLocalStorage.getStore()[key];
  }

  public static getCurrentUserId(): number {
    return this.asyncLocalStorage.getStore().userId as number;
  }
}

export { AsyncStorage };
