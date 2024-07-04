import {Controller, Delete, Get} from "@nestjs/common";
import {HistorialService} from "./historial.service";

@Controller('historial')
export class HistorialController {
    constructor(private readonly historialService: HistorialService){}

    @Get('getHistorial')
    async getHistorial() {
        return await this.historialService.getHistorial();
    }

    @Delete('deleteHistorial')
    async deleteHistorial() {
     return await this.historialService.deleteHistorial();
    }



}