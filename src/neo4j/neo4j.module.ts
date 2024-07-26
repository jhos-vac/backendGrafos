import {DynamicModule, Module} from '@nestjs/common';
import { Connection } from 'cypher-query-builder';
import { QueryRepository } from './query.repository';
import {ConnectionWithDriver, Neo4jConfig} from "./neo4j-config.interface";
import {NEO4J_CONFIG, NEO4J_CONNECTION} from "./neo4j.constants";
import {createDatabaseConfig} from './neo4j.utils';
import {ConfigModule, ConfigService} from "@nestjs/config";



@Module({
  providers: [QueryRepository],
})
export class Neo4jModule {
  static forRootAsync(customConfig?: Neo4jConfig): DynamicModule {
    return {
      module: Neo4jModule,
      imports: [ConfigModule],
      global: true,
      providers: [
        {
          provide: NEO4J_CONFIG,
          inject: [ConfigService
          ],
          useFactory: (configService: ConfigService) =>
            createDatabaseConfig(configService, customConfig),
        },
        {
          provide: NEO4J_CONNECTION,
          inject: [NEO4J_CONFIG],
          useFactory: async (config: Neo4jConfig) => {
            try {
              const { host, scheme, port, username, password } = config;
              const connection= new Connection (`${scheme}://${host}${port}`,{username, password}) as ConnectionWithDriver
                await connection.driver.verifyConnectivity();
              return connection;

            } catch (error) {
              throw new Error(`Error connecting to database: ${error.message}`);
            }
          },
        },
      ],
        exports: [NEO4J_CONNECTION, QueryRepository],
    };
  }
}
