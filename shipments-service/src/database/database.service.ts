import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      connectionString: this.config.get<string>('DATABASE_URL'),
    });
  }

  async onModuleInit() {
    await this.pool.query('SELECT 1');
    await this.createSchema();
    this.logger.log('Connected to shipments database');
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
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY,
        customer_id TEXT NOT NULL,
        origin_address JSONB NOT NULL,
        destination_address JSONB NOT NULL,
        parcel JSONB NOT NULL,
        service_level TEXT NOT NULL,
        declared_value NUMERIC(12,2) NOT NULL,
        status TEXT NOT NULL,
        tracking_code TEXT,
        parcel_reservation_id TEXT,
        route_reservation_id TEXT,
        correlation_id UUID NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL,
        failure_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS shipment_saga_logs (
        id BIGSERIAL PRIMARY KEY,
        shipment_id UUID,
        step TEXT NOT NULL,
        status TEXT NOT NULL,
        detail JSONB,
        correlation_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }
}
