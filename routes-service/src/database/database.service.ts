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
    await this.seedRoutes();
    this.logger.log('Connected to routes database');
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
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        origin_prefix TEXT NOT NULL,
        destination_prefix TEXT NOT NULL,
        courier_zone TEXT NOT NULL,
        standard_days INTEGER NOT NULL,
        express_days INTEGER NOT NULL,
        base_price NUMERIC(12,2) NOT NULL,
        daily_capacity INTEGER NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS route_reservations (
        id UUID PRIMARY KEY,
        shipment_id UUID NOT NULL,
        route_id TEXT NOT NULL REFERENCES routes(id),
        service_level TEXT NOT NULL,
        courier_zone TEXT NOT NULL,
        status TEXT NOT NULL,
        correlation_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS dispatch_assignments (
        id UUID PRIMARY KEY,
        shipment_id UUID NOT NULL UNIQUE,
        tracking_code TEXT NOT NULL,
        route_reservation_id UUID NOT NULL,
        parcel_reservation_id UUID NOT NULL,
        status TEXT NOT NULL,
        correlation_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS failed_events (
        id BIGSERIAL PRIMARY KEY,
        event_name TEXT NOT NULL,
        payload JSONB NOT NULL,
        reason TEXT NOT NULL,
        correlation_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  private async seedRoutes() {
    await this.pool.query(`
      INSERT INTO routes (
        id, origin_prefix, destination_prefix, courier_zone,
        standard_days, express_days, base_price, daily_capacity
      )
      VALUES
        ('R-MX-SUR-001', '29', '29', 'CHIAPAS_LOCAL', 2, 1, 95.00, 60),
        ('R-MX-SUR-002', '29', '30', 'SURESTE', 4, 2, 180.00, 35),
        ('R-MX-CDMX-001', '29', '01', 'CDMX', 5, 3, 240.00, 25),
        ('R-MX-NORTE-001', '29', '64', 'NORTE', 7, 4, 310.00, 15)
      ON CONFLICT (id) DO NOTHING;
    `);
  }
}
