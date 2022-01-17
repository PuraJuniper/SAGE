declare module 'freezer-js' {
    export interface FreezerOptions{
        mutable: boolean,
        live: boolean,
        freezeInstances: boolean,
    }

    export type EventDict<E> = E extends {[K in keyof E]: (...args: any[]) => any} ? {
        [K in keyof E]: E[K]
    } : never;

    // FreezerEvents shortened to FE because it will be repeated a lot!
    type FE<T, E extends EventDict<any>> = E & {
        "update": (state: T, prevState: T) => void,
        "beforeAll": <K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) => void,
        "afterAll": <K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) => void,
    };

    export type FreezerListener<E extends EventDict<any>> = {
        on: <K extends keyof E>(eventName: K, cb: E[K]) => void;
        once: <K extends keyof E>(eventName: K, cb: E[K]) => void;
        off: <K extends keyof E>(eventName: K, cb: E[K]) => void;
        emit: <K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) => ReturnType<E[K]>;
        trigger: <K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) => ReturnType<E[K]>; // deprecated
    };
    
    export type FreezerNode<T, E extends EventDict<any>> = T extends Array<infer ArrayType> ? FreezerArray<ArrayType, E> : T extends string | number | boolean | null | undefined ? T : FreezerObject<T, E>;

    type FreezerCommon<T, E extends EventDict<any>> = FreezerListener<E> & {
        getListener(): FreezerListener<E>,
        now(): void,
        pivot(): FreezerNodePivoted<T, E, T>,
        reset(a: FreezerNode<T, E>): FreezerNode<T, E>,
        run(): void,
        set<K extends keyof T>(key: K, value: T[K]) : FreezerNode<T, E>; // Technically, freezer-js accepts `value: Partial<T[K]>` but that makes it possible to define an object of type T[K] without all its required properties
        set(state: Partial<T>) : FreezerNode<T, E>; // The above problem doesn't apply here since all required properties of T must have been set for this call to be made
        toJS(): T,
        transact(): void,
    }

    type FreezerArray<T, E extends EventDict<any>> = FreezerCommon<T, E> & {
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
    } & FreezerNode<T, E>[];

    // From https://stackoverflow.com/a/53899815
    type OptionalPropertyOf<T> = Exclude<{
        [K in keyof T]: T extends Record<K, T[K]>
          ? never
          : K
      }[keyof T], undefined>
      
    type FreezerObject<T, E extends EventDict<any>> = FreezerCommon<T, E> & {
        remove(a: OptionalPropertyOf<T>): FreezerObject<T, E>,
        remove(a: OptionalPropertyOf<T>[]): FreezerObject<T, E>,
    } & {
        [K in keyof T]-?: FreezerNode<T[K], E>
    };

    // Definitions repeated for pivots
    export type FreezerNodePivoted<PivotType, E extends EventDict<any>, T> = T extends Array<infer Type> ? FreezerArrayPivoted<PivotType, E, Type> : T extends string | number | boolean | null | undefined ? T : FreezerObjectPivoted<PivotType, E, T>;

    type FreezerCommonPivoted<PivotType, E extends EventDict<any>, T> = FreezerListener<E> & {
        getListener(): void,
        now(): void,
        pivot(): FreezerNodePivoted<T, E, T>,
        reset(a: FreezerNode<T, E>): FreezerNodePivoted<PivotType, E, PivotType>,
        run(): void,
        set(state: Partial<T>) : FreezerNodePivoted<PivotType, E, PivotType>;
        set<K extends keyof T>(key: K, value: Partial<T[K]>) : FreezerNodePivoted<PivotType, E, PivotType>;
        toJS(): T,
        transact(): void,
    }

    type FreezerArrayPivoted<PivotType, E extends EventDict<any>, T> = FreezerCommonPivoted<PivotType, E, T> & {
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

    type FreezerObjectPivoted<PivotType, E extends EventDict<any>, T> = FreezerCommonPivoted<PivotType, E, T> & {
        // remove(a: string): FreezerObject<Omit<T,a>>,
        remove(a: string): FreezerNodePivoted<PivotType, E, PivotType>,
        remove(a: string[]): FreezerNodePivoted<PivotType, E, PivotType>,
    } & {
        [K in keyof T]-?: FreezerNodePivoted<PivotType, E, T[K]>
    };

    export class Freezer<T, E extends EventDict<any>>{
        constructor(a: T, b?: FreezerOptions);

        get() : FreezerNode<T, FE<T, E>>;
        set(state: T) : FreezerNode<T, FE<T, E>>;
        set(state: FreezerNode<T, FE<T, E>>) : FreezerNode<T, FE<T, E>>;
        // set() : FreezerCommon<T, FE<T, E>>;
        
        getEventHub() : FreezerListener<FE<T, E>>;

        getData() : FreezerCommon<T, FE<T, E>>;
        setData() : FreezerCommon<T, FE<T, E>>;

        on: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => void;
        once: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => void;
        off: <K extends keyof FE<T, E>>(eventName: K, cb: FE<T, E>[K]) => void;
        emit: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<FE<T, E>[K]>) => ReturnType<FE<T, E>[K]>;
        trigger: <K extends keyof FE<T, E>>(eventName: K, ...args: Parameters<FE<T, E>[K]>) => ReturnType<FE<T, E>[K]>; // deprecated

        // reset(newData:any):void;

    }

    export default Freezer;
}
