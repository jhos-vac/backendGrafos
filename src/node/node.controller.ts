import {Controller, Delete, Get} from '@nestjs/common';
import {NodeService} from "./node.service";

@Controller('node')
export class NodeController {
    constructor(private readonly  nodeService: NodeService) {}

    @Get('getGraph')
    async getNodes() {
        return this.nodeService.getNodes();
    }

    @Delete('deleteGraph')
    async deleteGraph() {
        return this.nodeService.deleteGraph();
    }

}
