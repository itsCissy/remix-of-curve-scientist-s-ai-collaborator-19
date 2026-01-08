/**
 * 本地 Supabase 兼容客户端
 * 提供与 Supabase 相同的 API 接口，但使用 IndexedDB 存储
 */

import { localDb, subscribeToTable } from './localDb';

// 模拟 Supabase 查询构建器
class QueryBuilder<T = any> {
  private tableName: string;
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private orderByField: string | null = null;
  private orderAsc: boolean = true;
  private selectFields: string = '*';
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private insertData: any = null;
  private updateData: any = null;
  private isDelete: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: 'neq', value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  private getTableApi() {
    switch (this.tableName) {
      case 'projects': return localDb.projects;
      case 'messages': return localDb.messages;
      case 'branches': return localDb.branches;
      case 'collaborators': return localDb.collaborators;
      case 'file_assets': return localDb.fileAssets;
      default: throw new Error(`Unknown table: ${this.tableName}`);
    }
  }

  private applyFilters(data: any[]): any[] {
    return data.filter(item => {
      return this.filters.every(f => {
        const itemValue = item[f.field];
        switch (f.op) {
          case 'eq': return itemValue === f.value;
          case 'neq': return itemValue !== f.value;
          default: return true;
        }
      });
    });
  }

  private applyOrder(data: any[]): any[] {
    if (!this.orderByField) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[this.orderByField!];
      const bVal = b[this.orderByField!];
      
      if (aVal < bVal) return this.orderAsc ? -1 : 1;
      if (aVal > bVal) return this.orderAsc ? 1 : -1;
      return 0;
    });
  }

  async then<TResult1 = { data: T | T[] | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result as any;
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }

  private async execute(): Promise<{ data: T | T[] | null; error: any }> {
    try {
      const api = this.getTableApi();

      // INSERT
      if (this.insertData) {
        console.log('[LocalSupabase] INSERT:', this.tableName, this.insertData);
        const result = await api.insert(this.insertData);
        console.log('[LocalSupabase] INSERT result:', result);
        return { data: result, error: null };
      }

      // UPDATE
      if (this.updateData) {
        console.log('[LocalSupabase] UPDATE:', this.tableName, this.updateData, 'filters:', this.filters);
        const idFilter = this.filters.find(f => f.field === 'id' && f.op === 'eq');
        if (idFilter) {
          const result = await api.update(idFilter.value, this.updateData);
          return { data: result, error: null };
        }
        
        // Update by other filters
        const allData = await api.getAll();
        const filtered = this.applyFilters(allData);
        console.log('[LocalSupabase] UPDATE filtered items:', filtered.length);
        for (const item of filtered) {
          await api.update(item.id, this.updateData);
        }
        return { data: null, error: null };
      }

      // DELETE
      if (this.isDelete) {
        const idFilter = this.filters.find(f => f.field === 'id' && f.op === 'eq');
        if (idFilter) {
          await api.delete(idFilter.value);
          return { data: null, error: null };
        }
        
        // Delete by other filters
        const allData = await api.getAll();
        const filtered = this.applyFilters(allData);
        for (const item of filtered) {
          await api.delete(item.id);
        }
        return { data: null, error: null };
      }

      // SELECT
      let data = await api.getAll();
      data = this.applyFilters(data);
      data = this.applyOrder(data);
      
      if (this.limitCount) {
        data = data.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        return { data: data[0] || null, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('[LocalSupabase] execute error:', this.tableName, error);
      return { data: null, error };
    }
  }
}

// 模拟 Realtime Channel
class RealtimeChannel {
  private tableName: string;
  private callbacks: Array<{ event: string; callback: (payload: any) => void }> = [];
  private unsubscribers: Array<() => void> = [];

  constructor(channelName: string) {
    this.tableName = channelName.replace(/-.*$/, ''); // Extract table name from channel
  }

  on(
    event: string,
    config: { event: string; schema: string; table: string; filter?: string },
    callback: (payload: any) => void
  ) {
    this.callbacks.push({ event: config.event, callback });
    return this;
  }

  subscribe() {
    for (const { event, callback } of this.callbacks) {
      const unsub = subscribeToTable(this.tableName, event === '*' ? '*' : event.toUpperCase(), (payload) => {
        callback(payload);
      });
      this.unsubscribers.push(unsub);
    }
    return this;
  }

  unsubscribe() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

// 本地 Supabase 客户端
export const localSupabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
  
  channel: (name: string) => new RealtimeChannel(name),
  
  removeChannel: (channel: RealtimeChannel) => {
    channel.unsubscribe();
  },
};

export default localSupabase;

