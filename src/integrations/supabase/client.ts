// Supabase 客户端 - 支持本地存储模式
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import localSupabase from '@/lib/localSupabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 是否使用本地存储模式
// 设置为 true 使用 IndexedDB 本地存储
// 设置为 false 使用 Supabase 远程数据库
export const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// 远程 Supabase 客户端
const remoteSupabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// 导出客户端（根据配置选择本地或远程）
export const supabase = USE_LOCAL_STORAGE 
  ? localSupabase as unknown as SupabaseClient<Database>
  : remoteSupabase!;

// 判断是否为本地模式
export const isLocalMode = () => USE_LOCAL_STORAGE;

console.log(`[Supabase] 使用 ${USE_LOCAL_STORAGE ? '本地 IndexedDB' : '远程 Supabase'} 存储模式`);