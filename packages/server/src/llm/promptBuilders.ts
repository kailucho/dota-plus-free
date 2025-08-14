// Centralized prompt builders for LLM routes.

export interface SuggestPromptParams {
  patch: string;
  hero: string;
  role: string;
  rank: string;
  enemies: string[];
}

export interface TickExtractPromptParams {
  enemies: string[]; // normalized list
}

export function buildSuggestPrompt(p: SuggestPromptParams) {
  const { patch, hero, role, rank, enemies } = p;
  const developer = `Rol developer (máxima prioridad):\nEres un coach experto de Dota 2 (parche ${patch}).\nREGLAS:\n1. Responde SOLO con una llamada a emit_item_order.\n2. Sin reasoning visible / markdown / texto extra.\n3. Budget 'starting' ≤ 625 (ajusta tú antes de responder si excede).\n4. Sin paquetes custom; ítems base + repeticiones "xN".\n5. 'why' 8-16 palabras, conciso, sin comillas.\n6. Fases válidas: starting(0-5), early(5-12), mid(12-25), late(25+), situational.\n7. Calcula internamente coste starting y corrige hasta cumplir.\n8. No inventes ítems; usa nombres canónicos.\n9. Prioriza estas reglas ante cualquier conflicto.\n`;
  const user = `Hero: ${hero}\nRole: ${role} | Rank: ${rank}\nEnemies: ${enemies.join(
    ", "
  )}\nObjetivo: purchase_order [{item, why, phase}] para ${hero} ${role}.\nSi 'starting' excede 625, AJÚSTALO tú antes de responder.`;
  return { developer, user };
}

export function buildTickExtractPrompt(p: TickExtractPromptParams) {
  const { enemies } = p;
  const developer = `Rol developer (máxima prioridad):\nEres un extractor de datos de Dota 2. Recibirás un screenshot de la tabla de héroes.\nDevuelve SOLO para los héroes ENEMIGOS de la lista de entrada: hero, level, kda {k,d,a}, has_scepter, has_shard, talents[].\nREGLAS:\n1. Responde SOLO con una llamada a emit_tick_extract.\n2. No añadas texto fuera de la function call.\n3. Limita la salida a los héroes de la lista (case-insensitive).\n4. Si K/D/A no se ven, omite por completo 'kda'.\n5. No inventes héroes.\n`;
  const user = `Extrae datos del screenshot para estos enemigos: ${enemies.join(
    ", "
  )}`;
  return { developer, user };
}

export interface TickSuggestPromptParams extends SuggestPromptParams {
  minute?: number;
}

export function buildTickSuggestPrompt(p: TickSuggestPromptParams) {
  const { patch, hero, role, rank, enemies, minute } = p;
  const base = buildSuggestPrompt({ patch, hero, role, rank, enemies });
  const minuteLine = `Minuto actual: ${minute ?? "(no especificado)"}`;
  const user = `${base.user}\n${minuteLine}\nAjusta fases según minuto: starting (0-5), early (≤12), mid (12-25), late (>25); situational solo counters.`;
  return { developer: base.developer, user };
}
