import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {IaService} from "./ia.service";

@Controller('ia')
export class IaController {
    constructor(private readonly iaService: IaService){}

    @Post('generateEntity')
    async generateEntity(
        @Body('text') text: string,
        @Body('studentLv') studentLevel: string,
        @Body('nameStudent') nameStudent: string
    ) {
        return await this.iaService.generateEntity(text, studentLevel, nameStudent);
    }

    @Get(':graphId')
    async getGraphByGraphId(@Param('graphId') graphId: string) {
        return await this.iaService.getGraphByGraphId(graphId);
    }

}
