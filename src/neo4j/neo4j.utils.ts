import { ConfigService } from '@nestjs/config';
import { Neo4jConfig } from './neo4j-config.interface';

export const createDatabaseConfig = (
  configService: ConfigService,
  customConfig: Neo4jConfig,
): Neo4jConfig =>
  customConfig || {
    host: configService.get<string>('NEO4J_HOST'),
    port: configService.get<number>('NEO4J_PORT'),
    username: configService.get<string>('NEO4J_USERNAME'),
    password: configService.get<string>('NEO4J_PASSWORD'),
    scheme: configService.get<string>('NEO4J_SCHEME'),
  };
