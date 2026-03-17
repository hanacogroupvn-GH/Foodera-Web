/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PDF_BUCKET?: string;
  readonly VITE_SUPABASE_IMAGE_BUCKET?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_TRANSLATE_MODEL?: string;
  readonly VITE_OLLAMA_BASE_URL?: string;
  readonly VITE_OLLAMA_API_KEY?: string;
  readonly VITE_OLLAMA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
