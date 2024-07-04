import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {Neo4jModule} from "./neo4j/neo4j.module";
import {ConfigModule} from "@nestjs/config";
import { IaModule } from './ia/ia.module';
import { NodeModule } from './node/node.module';
import {PrismaModule} from "./prisma.module";
import {HistorialModule} from "./historial/historial.module";


@Module({
  imports: [
      Neo4jModule.forRootAsync(),
      ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
      IaModule,
      NodeModule,
      PrismaModule,
      HistorialModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
