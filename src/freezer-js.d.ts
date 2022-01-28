declare module 'freezer-js' {
    export interface FreezerOptions{
        mutable: boolean,
        live: boolean,
        freezeInstances: boolean,
    }

    export type ExtractTypeOfFN<FN> = FN extends FreezerNode<infer T, infer E> ? T : never;
    
    export type EventDict<E> = E extends {[K in keyof E]: (...args: any[]) => unknown} ? {
        [K in keyof E]: E[K]
    } : never;

    // FreezerEvents shortened to FE because it will be repeated a lot!
    export type FE<T, E> = E & {
        "update": (state: T, prevState: T) => void,
        "beforeAll": <K extends keyof E>(eventName: K, ...args: Parameters<E extends EventDict<E> ? E[K] : never>) => void,
        "afterAll": <K extends keyof E>(eventName: K, ...args: Parameters<E extends EventDict<E> ? E[K] : never>) => void,
    };

    export type FreezerListener<T, E> = {
        on: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        once: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        off: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        emit: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<E extends EventDict<E> ? FE<T, E>[K] : never>) => ReturnType<E extends EventDict<E> ? FE<T, E>[K] : never>;
        trigger: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<E extends EventDict<E> ? FE<T, E>[K] : never>) => ReturnType<E extends EventDict<E> ? FE<T, E>[K] : never>; // deprecated
    };
    
    export type FreezerNode<T, E> = T extends Array<infer ArrayType> ? FreezerArray<ArrayType, E> : T extends string | number | boolean | null | undefined ? T : FreezerObject<T, E>;

    type FreezerCommon<T, E> = FreezerListener<T, E> & {
        getListener(): FreezerListener<T, E>,
        now(): void,
        pivot(): FreezerNodePivoted<T, E, T>,
        reset(a: FreezerNode<T, E>): FreezerNode<T, E>,
        run(): void,
        set<K extends keyof T>(key: K, value: T[K]) : FreezerNode<T, E>; // Technically, freezer-js accepts `value: Partial<T[K]>` but that makes it possible to define an object of type T[K] without all its required properties
        set(state: Partial<T>) : FreezerNode<T, E>; // The above problem doesn't apply here since all required properties of T must have been set for this call to be made
        toJS(): T,
        transact(): void,
    }

    type FreezerArray<T, E> = FreezerCommon<T, E> & {
        append(a: T[]): FreezerArray<T, E>,
        pop(): T | undefined,
        prepend(): FreezerArray<T, E>,
        push(a: T): FreezerArray<T, E>,
        shift(): FreezerArray<T, E>,
        sort(): FreezerArray<T, E>,
        splice(start: number, deleteCount: number, ...items: T[]): FreezerArray<T, E>,
        splice(start: number, deleteCount: number, item: T): FreezerArray<T, E>,
        splice(start: number, deleteCount?: number): FreezerArray<T, E>,
        unshift(): FreezerArray<T, E>,
        [Symbol.iterator](): Iterator<FreezerNode<T, E>>, // for..of statements use this
        [idx: number]: FreezerNode<T, E>,
    } & T[]; // Technically this last part should be `FreezerNode<T, E>[]` because any array function that returns some copy 
             //  of the underlying data and is not overridden by freezer.js will return "detached" freezer.js tree nodes.
             // Calling any freezer.js function on a "detached" node is typically (always?) unintended because those changes will 
             //  not be reflected in the actual state tree, so we may as well not consider them freezer.js nodes to avoid any 
             //  expectations from calling freezer.js functions on them.

    // From https://stackoverflow.com/a/53899815
    type OptionalPropertyOf<T> = Exclude<{
        [K in keyof T]: T extends Record<K, T[K]>
          ? never
          : K
      }[keyof T], undefined>
      
    type FreezerObject<T, E> = FreezerCommon<T, E> & {
        remove(a: OptionalPropertyOf<T>): FreezerObject<T, E>,
        remove(a: OptionalPropertyOf<T>[]): FreezerObject<T, E>,
    } & {
        [K in keyof T]-?: FreezerNode<T[K], E>
    };

    // Definitions repeated for pivots
    export type FreezerNodePivoted<PivotType, E, T> = T extends Array<infer ArrayType> ? FreezerArrayPivoted<PivotType, E, ArrayType> : T extends string | number | boolean | null | undefined ? T : FreezerObjectPivoted<PivotType, E, T>;

    type FreezerCommonPivoted<PivotType, E, T> = FreezerListener<T, E> & {
        getListener(): void,
        now(): void,
        pivot(): FreezerNodePivoted<T, E, T>,
        reset(a: FreezerNode<T, E>): FreezerNodePivoted<PivotType, E, PivotType>,
        run(): void,
        set<K extends keyof T>(key: K, value: T[K]) : FreezerNodePivoted<PivotType, E, PivotType>;
        set(state: Partial<T>) : FreezerNodePivoted<PivotType, E, PivotType>;
        toJS(): T,
        transact(): void,
    }

    type FreezerArrayPivoted<PivotType, E, T> = FreezerCommonPivoted<PivotType, E, T> & {
        append(): FreezerNodePivoted<PivotType, E, PivotType>,
        pop(): T | undefined,
        prepend(): FreezerNodePivoted<PivotType, E, PivotType>,
        push(): FreezerNodePivoted<PivotType, E, PivotType>,
        shift(): FreezerNodePivoted<PivotType, E, PivotType>,
        sort(): FreezerNodePivoted<PivotType, E, PivotType>,
        splice(start: number, deleteCount: number, ...items: T[]): FreezerNodePivoted<PivotType, E, PivotType>,
        splice(start: number, deleteCount: number, item: T): FreezerNodePivoted<PivotType, E, PivotType>,
        splice(start: number, deleteCount?: number): FreezerNodePivoted<PivotType, E, PivotType>,
        unshift(): FreezerNodePivoted<PivotType, E, PivotType>,
    } & FreezerNodePivoted<PivotType, E, T>[];

    type FreezerObjectPivoted<PivotType, E, T> = FreezerCommonPivoted<PivotType, E, T> & {
        // remove(a: string): FreezerObject<Omit<T,a>>,
        remove(a: string): FreezerNodePivoted<PivotType, E, PivotType>,
        remove(a: string[]): FreezerNodePivoted<PivotType, E, PivotType>,
    } & {
        [K in keyof T]-?: FreezerNodePivoted<PivotType, E, T[K]>
    };

    export class Freezer<T, E>{
        constructor(a: T, b?: FreezerOptions);

        get() : FreezerNode<T, E>;
        set(state: T) : FreezerNode<T, E>;
        set(state: FreezerNode<T, E>) : FreezerNode<T, E>;
        // set() : FreezerCommon<T, FE<T, E>>;
        
        getEventHub() : FreezerListener<T, E>;

        getData() : FreezerCommon<T, E>;
        setData() : FreezerCommon<T, E>;

        on: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        once: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        off: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => FreezerListener<T, E>;
        emit: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<E extends EventDict<E> ? FE<T, E>[K] : never>) => ReturnType<E extends EventDict<E> ? FE<T, E>[K] : never>;
        trigger: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<E extends EventDict<E> ? FE<T, E>[K] : never>) => ReturnType<E extends EventDict<E> ? FE<T, E>[K] : never>; // deprecated

        // reset(newData:any):void;

    }

    export default Freezer;
}
