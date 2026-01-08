/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  // 本地存储模式开关
  readonly VITE_USE_LOCAL_STORAGE?: string
  // AI 配置环境变量（本地模式使用）
  readonly VITE_AI_API_KEY?: string
  readonly VITE_AI_API_URL?: string
  readonly VITE_AI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
