-- ==============================================================================
-- ZYCONOMES INSTITUTIONAL BANKING - SCHEMA INICIAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    cpf_hash VARCHAR(64) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE_OTP',
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices B-Tree Estruturais (Prevenção de Sequential Scans sob carga)
-- Criados de forma concorrente para não realizar table lock em produção.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_email ON users (email);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_cpf ON users (cpf_hash);

-- Índice Parcial de Estado Ativo (Buscas rápidas de usuários operacionais)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_ativos ON users (id) WHERE status = 'ATIVO';

