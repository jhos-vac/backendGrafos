import {Module} from "@nestjs/common";
import {HistorialService} from "./historial.service";
import {HistorialController} from "./historial.controller";

@Module({
    exports: [HistorialService],
    providers: [HistorialService],
    controllers: [HistorialController]
})
export class HistorialModule {}