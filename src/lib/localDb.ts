/**
 * 本地数据库实现 - 使用 IndexedDB
 * 提供与 Supabase 兼容的 API 接口
 */

const DB_NAME = 'curve_local_db';
const DB_VERSION = 1;

// 表定义
const STORES = {
  projects: 'projects',
  messages: 'messages',
  branches: 'branches',
  collaborators: 'collaborators',
  file_assets: 'file_assets',
};

// 事件总线 - 用于模拟 realtime
type EventCallback = (payload: any) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

export function emitEvent(table: string, event: string, payload: any) {
  const key = `${table}:${event}`;
  const listeners = eventListeners.get(key);
  if (listeners) {
    listeners.forEach(cb => cb(payload));
  }
  // Also emit wildcard
  const wildcardListeners = eventListeners.get(`${table}:*`);
  if (wildcardListeners) {
    wildcardListeners.forEach(cb => cb({ eventType: event, ...payload }));
  }
}

export function subscribeToTable(table: string, event: string, callback: EventCallback): () => void {
  const key = `${table}:${event}`;
  if (!eventListeners.has(key)) {
    eventListeners.set(key, new Set());
  }
  eventListeners.get(key)!.add(callback);
  
  return () => {
    eventListeners.get(key)?.delete(callback);
  };
}

// IndexedDB 初始化
let dbInstance: IDBDatabase | null = null;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  // 防止重复打开
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = new Promise((resolve, reject) => {
    // 添加超时处理
    const timeout = setTimeout(() => {
      console.error('[LocalDb] IndexedDB open timeout after 5s');
      reject(new Error('IndexedDB open timeout'));
    }, 5000);
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      clearTimeout(timeout);
      console.error('[LocalDb] IndexedDB open error:', request.error);
      dbPromise = null;
      reject(request.error);
    };
    
    request.onblocked = () => {
      console.warn('[LocalDb] IndexedDB open blocked - close other tabs with this app');
    };
    
    request.onsuccess = () => {
      clearTimeout(timeout);
      dbInstance = request.result;
      
      // 处理数据库连接关闭事件
      dbInstance.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };
      
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Projects 表
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const projectStore = db.createObjectStore(STORES.projects, { keyPath: 'id' });
        projectStore.createIndex('is_active', 'is_active', { unique: false });
        projectStore.createIndex('updated_at', 'updated_at', { unique: false });
      }
      
      // Messages 表
      if (!db.objectStoreNames.contains(STORES.messages)) {
        const messageStore = db.createObjectStore(STORES.messages, { keyPath: 'id' });
        messageStore.createIndex('project_id', 'project_id', { unique: false });
        messageStore.createIndex('branch_id', 'branch_id', { unique: false });
        messageStore.createIndex('created_at', 'created_at', { unique: false });
      }
      
      // Branches 表
      if (!db.objectStoreNames.contains(STORES.branches)) {
        const branchStore = db.createObjectStore(STORES.branches, { keyPath: 'id' });
        branchStore.createIndex('project_id', 'project_id', { unique: false });
        branchStore.createIndex('is_main', 'is_main', { unique: false });
      }
      
      // Collaborators 表
      if (!db.objectStoreNames.contains(STORES.collaborators)) {
        const collabStore = db.createObjectStore(STORES.collaborators, { keyPath: 'id' });
        collabStore.createIndex('project_id', 'project_id', { unique: false });
      }
      
      // File Assets 表
      if (!db.objectStoreNames.contains(STORES.file_assets)) {
        const fileStore = db.createObjectStore(STORES.file_assets, { keyPath: 'id' });
        fileStore.createIndex('project_id', 'project_id', { unique: false });
        fileStore.createIndex('branch_id', 'branch_id', { unique: false });
      }
    };
  });
  
  return dbPromise;
}

// 通用 CRUD 操作
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function insert<T extends { id?: string }>(storeName: string, data: T): Promise<T> {
  const db = await openDatabase();
  const record = {
    ...data,
    id: data.id || crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(record);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      emitEvent(storeName, 'INSERT', { new: record });
      resolve(record as T);
    };
  });
}

async function update<T>(storeName: string, id: string, updates: Partial<T>): Promise<T | null> {
  const db = await openDatabase();
  const existing = await getById<T>(storeName, id);
  if (!existing) return null;
  
  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(updated);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      emitEvent(storeName, 'UPDATE', { old: existing, new: updated });
      resolve(updated as T);
    };
  });
}

async function remove(storeName: string, id: string): Promise<boolean> {
  const db = await openDatabase();
  const existing = await getById(storeName, id);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      emitEvent(storeName, 'DELETE', { old: existing });
      resolve(true);
    };
  });
}

async function removeByIndex(storeName: string, indexName: string, value: any): Promise<number> {
  const items = await getByIndex<{ id: string }>(storeName, indexName, value);
  for (const item of items) {
    await remove(storeName, item.id);
  }
  return items.length;
}

// 导出 API
export const localDb = {
  // Projects
  projects: {
    getAll: () => getAll<any>(STORES.projects),
    getById: (id: string) => getById<any>(STORES.projects, id),
    insert: (data: any) => insert(STORES.projects, data),
    update: (id: string, updates: any) => update(STORES.projects, id, updates),
    delete: (id: string) => remove(STORES.projects, id),
    setAllInactive: async () => {
      const all = await getAll<any>(STORES.projects);
      for (const p of all) {
        if (p.is_active) {
          await update(STORES.projects, p.id, { is_active: false });
        }
      }
    },
  },
  
  // Messages
  messages: {
    getAll: () => getAll<any>(STORES.messages),
    getById: (id: string) => getById<any>(STORES.messages, id),
    getByProjectId: (projectId: string) => getByIndex<any>(STORES.messages, 'project_id', projectId),
    insert: (data: any) => insert(STORES.messages, data),
    update: (id: string, updates: any) => update(STORES.messages, id, updates),
    delete: (id: string) => remove(STORES.messages, id),
    deleteByProjectId: (projectId: string) => removeByIndex(STORES.messages, 'project_id', projectId),
  },
  
  // Branches
  branches: {
    getAll: () => getAll<any>(STORES.branches),
    getById: (id: string) => getById<any>(STORES.branches, id),
    getByProjectId: (projectId: string) => getByIndex<any>(STORES.branches, 'project_id', projectId),
    insert: (data: any) => insert(STORES.branches, data),
    update: (id: string, updates: any) => update(STORES.branches, id, updates),
    delete: (id: string) => remove(STORES.branches, id),
  },
  
  // Collaborators
  collaborators: {
    getAll: () => getAll<any>(STORES.collaborators),
    getById: (id: string) => getById<any>(STORES.collaborators, id),
    getByProjectId: (projectId: string) => getByIndex<any>(STORES.collaborators, 'project_id', projectId),
    insert: (data: any) => insert(STORES.collaborators, data),
    update: (id: string, updates: any) => update(STORES.collaborators, id, updates),
    delete: (id: string) => remove(STORES.collaborators, id),
  },
  
  // File Assets
  fileAssets: {
    getAll: () => getAll<any>(STORES.file_assets),
    getById: (id: string) => getById<any>(STORES.file_assets, id),
    getByProjectId: (projectId: string) => getByIndex<any>(STORES.file_assets, 'project_id', projectId),
    insert: (data: any) => insert(STORES.file_assets, data),
    update: (id: string, updates: any) => update(STORES.file_assets, id, updates),
    delete: (id: string) => remove(STORES.file_assets, id),
  },
  
  // Realtime subscription
  subscribe: subscribeToTable,
};

export default localDb;

