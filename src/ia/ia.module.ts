import { Module } from '@nestjs/common';
import { IaService } from './ia.service';
import { IaController } from './ia.controller';

@Module({
  providers: [IaService],
  controllers: [IaController]
})
export class IaModule {}
