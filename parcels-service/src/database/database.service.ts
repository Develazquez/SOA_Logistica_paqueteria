import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      connectionString: config.get<string>('DATABASE_URL'),
    });
  }

  async onModuleInit() {
    await this.pool.query('SELECT 1');
    await this.createSchema();
    this.logger.log('Connected to parcels database');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  private async createSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS parcel_rules (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS parcel_reservations (
        id UUID PRIMARY KEY,
        shipment_id UUID NOT NULL,
        label_code TEXT NOT NULL UNIQUE,
        parcel JSONB NOT NULL,
        handling_category TEXT NOT NULL,
        status TEXT NOT NULL,
        correlation_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      INSERT INTO parcel_rules (name, description)
      VALUES
        ('max_weight', 'El paquete no debe superar 30 kg.'),
        ('max_dimension', 'Ningun lado debe superar 120 cm.'),
        ('restricted_content', 'No se aceptan contenidos restringidos.')
      ON CONFLICT (name) DO NOTHING;
    `);
  }
}
