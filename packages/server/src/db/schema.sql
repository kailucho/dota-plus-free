-- 1) partidas (una por /init)
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  patch TEXT NOT NULL,
  rank TEXT,
  hero TEXT NOT NULL,
  role TEXT NOT NULL,
  enemies TEXT NOT NULL,              -- JSON array de héroes: ["Void","Sniper",...]
  region_meta TEXT
);

-- 2) ticks (estado por minuto)
CREATE TABLE ticks (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  minute INTEGER NOT NULL,
  my_status_json TEXT NOT NULL,       -- JSON my_status
  enemy_status_json TEXT,             -- JSON array (puede ser null)
  team_econ_json TEXT,                -- JSON (networth_diff, xp_diff)
  objectives_json TEXT,               -- JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) recomendaciones (lo que devuelve OpenAI en cada momento)
CREATE TABLE suggestions (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  source TEXT NOT NULL,               -- "openai" | "rule" | "hybrid"
  minute INTEGER NOT NULL,
  response_json TEXT NOT NULL,        -- tu ResponseJSON completo
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) resultados (feedback/outcome)
CREATE TABLE outcomes (
  match_id TEXT PRIMARY KEY REFERENCES matches(id),
  result TEXT CHECK (result IN ('win','lose')) NOT NULL,
  duration_min INTEGER NOT NULL,
  mmr_delta INTEGER,
  notes TEXT
);
