import { Injectable } from '@nestjs/common';
import { ClientOptions, OpenAI } from 'openai';
import { QueryRepository } from "../neo4j/query.repository";
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class IaService {
    private openai: OpenAI;

    constructor(
        private configService: ConfigService,
        private queryRepository: QueryRepository,
        private prisma: PrismaClient
    ) {
        const options: ClientOptions = { apiKey: this.configService.get<string>('OPENAI_API') };
        this.openai = new OpenAI(options);
    }

    async generateEntity(text: string, studentLevel: string, nameStudent: string): Promise<string> {
        console.log("Parameters received:", { text, studentLevel, nameStudent });

        const context = JSON.stringify({ text });
        const prompt = `Extract the key concepts from the following text: ${context}`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that extracts concepts from provided texts, depending on the number of words in the text.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 500,
            });
            const entities = completion.choices[0].message.content;
            if (completion && completion.choices && completion.choices.length > 0) {
                const query = await this.generaQuery(context, entities);
                const calification = await this.Calification(context, studentLevel, query);
                const nodes = await this.createNode(query);
                console.log(nameStudent, context, studentLevel, calification, nodes.id);
                await this.saveCalification(nameStudent, context, studentLevel, calification, nodes.id);
                return calification;
            } else {
                throw new Error('La respuesta de la API no es válida');
            }
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    async Calification(context: string, studentLv: string, query: string): Promise<string> {
        const prompt = `Based on the number of relationships and concepts present in this query ${query}, extracted from the text, grade it from 1 to 100: ${context}, considering it was written by an English student at level ${studentLv}, including only the essential information.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a teacher responsible for grading an English text according to the student\'s level. Please provide the grading details in the following format:\n' +
                            '\n' +
                            '1. **Coherence and Organization (20 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            '2. **Grammar and Syntax (20 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            '3. **Vocabulary (20 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            '4. **Content and Relevance (20 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            '5. **Spelling and Punctuation (10 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            '6. **Creativity and Expression (10 points)**\n' +
                            '   - [Provide your comments here]\n' +
                            '\n' +
                            'Based on these criteria, please provide the final grading score in the format: Total Score: [score]/100 or Final Grade: [score]/100.\n'
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 1000,
            });
            const calification = completion.choices[0].message.content;
            return calification;
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    async generaQuery(context: string, entities: string): Promise<string> {
        const prompt = `Generate a Neo4j query, without considering previous queries. Avoid using ";" that allows relating these entities. Create the entities: ${entities}, using the following context to create the relationships: ${context}, creating a single graph where all entities are connected.`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that creates a query using Neo4j syntax from provided entities and contexts, removing titles, extra texts, quotes, and backticks that are not part of the entities. Remove tags and return the query as plain text.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 3000,
            });
            const query: string = completion.choices[0].message.content;
            return query;
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    async createNode(query: string): Promise<{ id: any }> {
        const graphId = uuidv4();
        const lines = query.split('\n');
        const modifiedLines = lines.map(line => {
            if (line.startsWith('CREATE')) {
                const match = line.match(/\(([^:]+):([^\s]+)\s*\{(.*)\}\)/);
                if (match) {
                    const [_, variable, label, properties] = match;
                    const newProperties = `graphId: '${graphId}', ${properties}`;
                    return `CREATE (${variable}:${label} {${newProperties}})`;
                }
            }
            return line;
        });
        const modifiedQuery = modifiedLines.join('\n');

        await this.queryRepository.initQuery()
            .raw(`${modifiedQuery}`)
            .run();

        return { id: graphId };
    }

    async saveCalification(nameStudent: string, context: string, studentLevel: string, calification: string, graphId: any) {
        if (!nameStudent || !context || !studentLevel || !calification || !graphId) {
            throw new Error('Missing required arguments');
        }
        await this.prisma.calification.create({
            data: {
                nameStudent,
                context,
                studentLevel,
                calification,
                graphId,
            },
        });
    }

    async getGraphByGraphId(graphId: string): Promise<any> {
        const session = this.queryRepository.initQuery();
        const query = `
            MATCH (n {graphId: $graphId})
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN n, r, m
        `;
        const result = await session.raw(query, { graphId }).run();
        return result;
    }
}
