import { openDB, DBSchema, IDBPDatabase } from 'npm:idb@8';

interface CacheDB extends DBSchema {
  wallets: {
    key: string;
    value: {
      userId: string;
      data: any;
      timestamp: number;
    };
  };
  transactions: {
    key: string;
    value: {
      userId: string;
      data: any;
      timestamp: number;
    };
  };
  stakes: {
    key: string;
    value: {
      userId: string;
      data: any;
      timestamp: number;
    };
  };
  p2pListings: {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
  pendingActions: {
    key: number;
    value: {
      action: string;
      data: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

class OfflineCache {
  private db: IDBPDatabase<CacheDB> | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async init() {
    if (this.db) return;

    this.db = await openDB<CacheDB>('alliance-web3-cache', 1, {
      upgrade(db) {
        // Wallets store
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets');
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions');
        }

        // Stakes store
        if (!db.objectStoreNames.contains('stakes')) {
          db.createObjectStore('stakes');
        }

        // P2P listings store
        if (!db.objectStoreNames.contains('p2pListings')) {
          db.createObjectStore('p2pListings');
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const store = db.createObjectStore('pendingActions', {
            keyPath: 'timestamp',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  async get(store: keyof CacheDB, key: string): Promise<any | null> {
    if (!this.db) await this.init();

    const cached = await this.db!.get(store as any, key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      await this.db!.delete(store as any, key);
      return null;
    }

    return cached.data;
  }

  async set(store: keyof CacheDB, key: string, data: any, userId?: string): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.put(store as any, {
      userId,
      data,
      timestamp: Date.now(),
    }, key);
  }

  async addPendingAction(action: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.add('pendingActions', {
      action,
      data,
      timestamp: Date.now(),
    });
  }

  async getPendingActions(): Promise<Array<{ action: string; data: any; timestamp: number }>> {
    if (!this.db) await this.init();

    return await this.db!.getAll('pendingActions');
  }

  async clearPendingAction(timestamp: number): Promise<void> {
    if (!this.db) await this.init();

    await this.db!.delete('pendingActions', timestamp);
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    const stores: Array<keyof CacheDB> = [
      'wallets',
      'transactions',
      'stakes',
      'p2pListings',
    ];

    for (const store of stores) {
      await this.db!.clear(store as any);
    }
  }

  async clearUserData(userId: string): Promise<void> {
    if (!this.db) await this.init();

    const stores = ['wallets', 'transactions', 'stakes'] as const;

    for (const storeName of stores) {
      const allKeys = await this.db!.getAllKeys(storeName);

      for (const key of allKeys) {
        const item = await this.db!.get(storeName, key as any);
        if (item && item.userId === userId) {
          await this.db!.delete(storeName, key as any);
        }
      }
    }
  }
}

export const offlineCache = new OfflineCache();

export async function syncPendingActions() {
  const actions = await offlineCache.getPendingActions();

  for (const pending of actions) {
    try {
      // Re-execute the action
      // This would call the appropriate API based on action type
      console.log('Syncing pending action:', pending.action);

      // If successful, remove from pending
      await offlineCache.clearPendingAction(pending.timestamp);
    } catch (error) {
      console.error('Failed to sync action:', error);
      // Keep in queue for next sync attempt
    }
  }
}

export function setupOnlineListener() {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing...');
    syncPendingActions();
  });
}
