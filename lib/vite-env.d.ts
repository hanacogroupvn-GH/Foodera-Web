/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_TRANSLATE_MODEL?: string;
  readonly VITE_OLLAMA_BASE_URL?: string;
  readonly VITE_OLLAMA_API_KEY?: string;
  readonly VITE_OLLAMA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.geojson?url' {
  const value: string;
  export default value;
}
