declare module 'cql-execution' {
    export class Library {
        constructor(elm: unknown);
        expressions: {[key: string]: ExpressionDef}
        source: {
            library: LibrarySource
        }
    }

    export interface ExpressionDef {
        name: string;
    }

    export interface LibrarySource {
        identifier: {
            id: string,
            version: string,
        }
    }

}