// Estrutura do banco de dados. Roda automaticamente na primeira conexão:
// cria o que estiver faltando e não apaga nada.
// Datas são guardadas como texto no formato AAAA-MM-DD.

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    cargo TEXT,
    papel TEXT NOT NULL DEFAULT 'membro',
    abas TEXT[] NOT NULL DEFAULT '{}',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT, email TEXT, documento TEXT, nascimento TEXT,
    endereco TEXT, cidade TEXT, origem TEXT, profissao TEXT,
    pasta_drive TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    tipo TEXT, area DOUBLE PRECISION, endereco_obra TEXT,
    status TEXT NOT NULL DEFAULT 'andamento',
    cor TEXT NOT NULL DEFAULT '#7C847A',
    valor DOUBLE PRECISION, inicio TEXT, previsao TEXT,
    pasta_drive TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS etapas (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL DEFAULT 0,
    nome TEXT NOT NULL,
    inicio TEXT, prazo TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    obs TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    descricao TEXT, valor DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'rascunho',
    enviado_em TEXT, assinado_em TEXT, link TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    data TEXT NOT NULL, hora TEXT,
    tipo TEXT NOT NULL DEFAULT 'reuniao',
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    local TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    vencimento TEXT NOT NULL,
    pago_em TEXT, forma TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS despesas (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT, fornecedor TEXT,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    vencimento TEXT NOT NULL,
    pago_em TEXT, forma TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS notas_fiscais (
    id SERIAL PRIMARY KEY,
    numero TEXT,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    receita_id INTEGER REFERENCES receitas(id) ON DELETE SET NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    emissao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'emitida',
    link TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    fornecedor TEXT, descricao TEXT NOT NULL,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'orcado',
    pago_em TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS repasses (
    id SERIAL PRIMARY KEY,
    parceiro TEXT NOT NULL, descricao TEXT,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    vencimento TEXT NOT NULL,
    pago_em TEXT, forma TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS servicos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL, descricao TEXT,
    unidade TEXT NOT NULL DEFAULT 'm²',
    valor DOUBLE PRECISION NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    projeto_id INTEGER REFERENCES projetos(id) ON DELETE SET NULL,
    nome TEXT, tipo TEXT, area DOUBLE PRECISION,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'rascunho',
    data TEXT NOT NULL,
    dados JSONB NOT NULL DEFAULT '{}',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY,
    valor JSONB NOT NULL
  )`,
  `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE projetos ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE eventos ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE receitas ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE despesas ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE compras ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE repasses ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS exemplo BOOLEAN NOT NULL DEFAULT FALSE`,
  `CREATE TABLE IF NOT EXISTS kit_unidades (
    id SERIAL PRIMARY KEY,
    grupo TEXT NOT NULL,
    numero INTEGER NOT NULL DEFAULT 1,
    endereco TEXT, locador TEXT,
    inquilino TEXT, telefone TEXT, documento TEXT,
    aluguel DOUBLE PRECISION NOT NULL DEFAULT 0,
    vencimento_dia INTEGER,
    inicio TEXT, fim TEXT,
    franquia_kwh DOUBLE PRECISION NOT NULL DEFAULT 150,
    valor_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.966,
    uc_agua TEXT, pasta_drive TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS kit_leituras (
    id SERIAL PRIMARY KEY,
    unidade_id INTEGER NOT NULL REFERENCES kit_unidades(id) ON DELETE CASCADE,
    data_anterior TEXT, leitura_anterior DOUBLE PRECISION NOT NULL DEFAULT 0,
    data_atual TEXT NOT NULL, leitura_atual DOUBLE PRECISION NOT NULL DEFAULT 0,
    valor_kwh DOUBLE PRECISION NOT NULL DEFAULT 0,
    franquia_kwh DOUBLE PRECISION NOT NULL DEFAULT 150,
    pago_em TEXT, obs TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // Reajuste Equatorial Goiás de 22/10/2026 (+7,36% residencial): R$ 0,90 → R$ 0,966 por kWh. Roda uma única vez.
  `UPDATE kit_unidades SET valor_kwh = 0.966 WHERE NOT EXISTS (SELECT 1 FROM config WHERE chave = 'kwh_reajuste_2026_10')`,
  `INSERT INTO config (chave, valor) VALUES ('kwh_reajuste_2026_10', '0.966') ON CONFLICT (chave) DO NOTHING`,
  `CREATE INDEX IF NOT EXISTS etapas_prazo_idx ON etapas (prazo)`,
  `CREATE INDEX IF NOT EXISTS receitas_venc_idx ON receitas (vencimento)`,
  `CREATE INDEX IF NOT EXISTS despesas_venc_idx ON despesas (vencimento)`,
];
