import { Injectable } from '@nestjs/common';
import {QueryRepository} from "../neo4j/query.repository";


@Injectable()
export class NodeService {
    constructor(private readonly queryRepository: QueryRepository) {
    };

    async getNodes() {
        const query = await this.queryRepository.initQuery()
            .raw(
                'MATCH (n) RETURN n'
            )
            .run()
        return query
    }

    async deleteGraph() {
        const query = await this.queryRepository.initQuery()
            .raw(
                'MATCH (n) DETACH DELETE n'
            )
            .run()
        return "Graph deleted"
    }

}
