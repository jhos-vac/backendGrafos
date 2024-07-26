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
        console.log(options)
        this.openai = new OpenAI(options);
    }

    async generateEntity(text: string, studentLevel: string, nameStudent: string): Promise<string> {
        console.log("Parameters received:", { text, studentLevel, nameStudent });

        const context = JSON.stringify({ text });
        const prompt = `Extrae los conceptos del siguiente texto: ${context}`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente que extrae conceptos de textos proporcionados, dependiendo del número de palabras que hay en el texto.',
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
        const prompt = `De acuerdo a la cantidad de relaciones y conceptos que haya en esta query ${query}, extraída del mismo texto, califica del 1 al 100: ${context}, teniendo en cuenta que fue escrito por un estudiante de inglés en el nivel ${studentLv}.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un maestro que se encarga de calificar un texto en inglés, de acuerdo al nivel en que se encuentra el estudiante.'
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 500,
            });
            const calification = completion.choices[0].message.content;
            return calification;
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    async generaQuery(context: string, entities: string): Promise<string> {
        const prompt = `Genera una query para Neo4j, no tengas en cuenta queries anteriores, evita utilizar ";" que permita relacionar estas entidades, crea las entidades: ${entities}, utilizando el siguiente contexto, crea las relaciones: ${context}, creando un solo grafo donde se unan todas las entidades, y asigna un id único a cada nodo.`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente que crea una query con la sintaxis de Neo4j, a partir de entidades y contextos proporcionados, eliminando títulos, textos extras, comillas y backticks que no sean parte de las entidades, elimina etiquetas y devuelve la query como texto plano.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.5,
                max_tokens: 1500,
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

        console.log("Data to be saved:", { nameStudent, context, studentLevel, calification, graphId });

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
