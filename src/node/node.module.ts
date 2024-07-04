import { Module } from '@nestjs/common';
import { NodeService } from './node.service';
import { NodeController } from './node.controller';
import {Neo4jModule} from "../neo4j/neo4j.module";

@Module({
  imports: [Neo4jModule],
  exports: [NodeService],
  providers: [NodeService],
  controllers: [NodeController]
})
export class NodeModule {}
