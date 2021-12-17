declare module 'cql-execution' {
    export class Library {
        constructor(elm: any);
        expressions: {[key: string]: ExpressionDef}
    }

    export interface ExpressionDef {
        name: string;
    }

}