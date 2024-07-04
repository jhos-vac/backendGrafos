import {Injectable} from "@nestjs/common";
import {PrismaClient} from "@prisma/client";

@Injectable()
export class HistorialService {

    constructor (private prisma: PrismaClient){}

    async getHistorial() {
        return await this.prisma.calification.findMany()
    }

    async deleteHistorial() {
        return await this.prisma.calification.deleteMany()
    }

}