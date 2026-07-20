/**
 * Adaptador de persistência.
 * - Dados compartilhados (projetos/tarefas): Supabase (Postgres na nuvem).
 *   Todos que acessam o site leem/gravam o mesmo banco.
 * - Preferências pessoais (tema, usuário): localStorage do navegador.
 * - Fallback: se o Supabase não estiver configurado ou estiver fora do ar,
 *   usa localStorage para não perder trabalho.
 *
 * Configuração: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env
 * e rode `npm run build` (as variáveis são embutidas no build).
 */
import { createClient } from "@supabase/supabase-js";

// Fallback embutido: a anon key é pública por design (vai dentro do build de
// qualquer forma, e o acesso é controlado pelas políticas RLS do banco).
// Garante que um deploy SEM as variáveis de ambiente continue usando o banco
// compartilhado em vez de cair no modo somente-local.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://uttfqpzbbjhwbotyrpqp.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dGZxcHpiYmpod2JvdHlycHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTUyNTcsImV4cCI6MjA5OTAzMTI1N30.0i-US-yBJWAEoAL9v3CKZYBZXU7-Ip8lELtJNFo2cYw";

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("SEU-PROJETO")
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const TABLE = "entries";

// Chaves que são pessoais, por navegador (não vão para o banco compartilhado)
const LOCAL_ONLY_KEYS = new Set(["verum-canvas-prefs"]);

const localGet = (key) => {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? null : { key, value: v };
  } catch {
    return null;
  }
};

const localSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return { key, value };
  } catch {
    return null;
  }
};

export const storage = {
  async get(key) {
    if (LOCAL_ONLY_KEYS.has(key) || !supabase) return localGet(key);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("key, value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      // Chave ainda não existe na nuvem: aproveita dados locais antigos, se houver.
      // O auto-save do app grava esses dados no Supabase logo em seguida.
      return data ?? localGet(key);
    } catch {
      return localGet(key);
    }
  },
  async set(key, value) {
    if (LOCAL_ONLY_KEYS.has(key) || !supabase) return localSet(key, value);
    try {
      const updated_at = new Date().toISOString();
      const { error } = await supabase.from(TABLE).upsert({ key, value, updated_at });
      if (error) throw error;
      localSet(key, value); // cópia local como backup
      return { key, value, updated_at };
    } catch {
      return localSet(key, value);
    }
  },
  // Só o carimbo de data da última gravação — barato de consultar em loop,
  // permite detectar mudanças de outros aparelhos sem baixar o JSON inteiro.
  async meta(key) {
    if (LOCAL_ONLY_KEYS.has(key) || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("updated_at")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data?.updated_at ?? null;
    } catch {
      return null;
    }
  },
};
