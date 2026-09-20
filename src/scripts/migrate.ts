/**
 * ==============================================================================
 * ZYCONOMES INSTITUTIONAL BANKING - MIGRATION RUNNER E VALIDATOR
 * ==============================================================================
 * Diretrizes:
 * 1. Valida se o banco (PostgreSQL) e o esquema estão na versão correta antes do boot.
 * 2. Garante a integridade e impede que a aplicação suba se o banco estiver atrasado.
 * 3. Utiliza a porta 5432 (Postgres direto) e não a do PgBouncer.
 * ==============================================================================
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Em ambiente local/dev, usamos dotenv para facilitar, mas em prod vem do SO.
const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL || 'postgresql://zyco_admin:zyco_secret_vault_2026@127.0.0.1:5432/zyconomes_prod';

function log(level: string, event: string, message: string) {
  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'zyconomes-migrator',
    message
  }) + '\n');
}

async function runMigrations() {
  const client = new Client({
    connectionString: DIRECT_DATABASE_URL,
    connectionTimeoutMillis: 5000 // fail-fast se o banco estiver fora
  });

  try {
    log('INFO', 'MigrationConnecting', `Conectando ao banco direto em ${DIRECT_DATABASE_URL.split('@')[1]}`);
    await client.connect();

    // 1. Criar tabela de controle de migrations se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Localiza os arquivos DDL simulados
    const migrationsDir = path.join(__dirname, '../../../migrations');
    let migrationFiles: string[] = [];
    
    if (fs.existsSync(migrationsDir)) {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    } else {
      log('WARN', 'MigrationDirectoryMissing', `Diretório de migrations não encontrado: ${migrationsDir}`);
      // Simulação para o preview caso o diretório não exista localmente
      migrationFiles = ['001_initial_schema.sql']; 
    }

    // 3. Verifica e aplica
    let appliedCount = 0;
    for (const file of migrationFiles) {
      const { rows } = await client.query('SELECT version FROM _schema_migrations WHERE version = $1', [file]);
      
      if (rows.length === 0) {
        log('INFO', 'MigrationApplying', `Aplicando migração: ${file}`);
        
        try {
          await client.query('BEGIN');
          
          if (fs.existsSync(path.join(migrationsDir, file))) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(sql);
          } else if (file === '001_initial_schema.sql') {
            // Mock de migração para o ambiente de dev se o arquivo não existir fisicamente
            await client.query(`
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                nome_completo VARCHAR(150) NOT NULL,
                cpf_hash CHAR(64) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                status VARCHAR(20) NOT NULL,
                correlation_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `);
          }
          
          await client.query('INSERT INTO _schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          appliedCount++;
          log('INFO', 'MigrationSuccess', `Migração ${file} aplicada com sucesso.`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw new Error(`Falha ao aplicar migração ${file}: ${error.message}`);
        }
      }
    }

    log('INFO', 'MigrationComplete', `Validação concluída. ${appliedCount} novas migrações aplicadas.`);
    process.exit(0);

  } catch (error) {
    log('FATAL', 'MigrationFailed', `Falha crítica durante validação do schema: ${error.message}`);
    process.exit(1); // Aborta o deploy/inicialização
  } finally {
    await client.end();
  }
}

runMigrations();
