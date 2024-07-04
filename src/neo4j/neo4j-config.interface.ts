import {Driver} from "neo4j-driver";
import {Connection} from "cypher-query-builder";

export type Neo4jScheme =
  | 'neo4j'
  | 'neo4j+s'
  | 'neo4j+ssc'
  | 'bolt'
  | 'bolt+s'
  | 'bolt+ssc';

export interface Neo4jConfig {
  scheme: string;
  host: string;
  port: number | string;
  username: string;
  password: string;
  database?: string;
}

export type ConnectionWithDriver = Connection & { driver: any | Driver };