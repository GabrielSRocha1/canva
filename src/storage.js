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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      const { error } = await supabase
        .from(TABLE)
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      localSet(key, value); // cópia local como backup
      return { key, value };
    } catch {
      return localSet(key, value);
    }
  },
};
