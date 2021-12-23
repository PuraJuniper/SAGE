declare module 'freezer-js' {
    
    export interface FreezerOptions{
        mutable: boolean,
        live: boolean,
        freezeInstances: boolean,
    }

    export interface FreezerListener {
        on:(eventName: string, cb: (...params:any[]) => void) => void;

        once:(eventName: string, cb: (...params:any[]) => void) => void;
        
        off:(eventName: string, cb: (...params:any[]) => void) => void;

        emit:(eventName:string, ...params:any[]) => void;
    }
    
    export type FreezerNode<T> = T extends Array<infer ArrayType> ? FreezerArray<ArrayType> : T extends string | number | boolean | null | undefined ? T : FreezerObject<T>;

    type FreezerCommon<T> = FreezerListener & {
        getListener(): FreezerListener,
        now(): void,
        pivot(): FreezerNodePivoted<T, T>,
        reset(a: FreezerNode<T>): FreezerNode<T>,
        run(): void,
        set(state: Partial<T>) : FreezerNode<T>;
        set<K extends keyof T>(key: K, value: Partial<T[K]>) : FreezerNode<T>;
        toJS(): T,
        transact(): void,
    }

    type FreezerArray<T> = FreezerCommon<T> & {
        append(a: T[]): FreezerArray<T>,
        pop(): T | undefined,
        prepend(): FreezerArray<T>,
        push(a: T): FreezerArray<T>,
        shift(): FreezerArray<T>,
        sort(): FreezerArray<T>,
        splice(start: number, deleteCount: number, ...items: T[]): FreezerNode<T>,
        splice(start: number, deleteCount: number, item: T): FreezerNode<T>,
        splice(start: number, deleteCount?: number): FreezerNode<T>,
        unshift(): FreezerArray<T>,
    } & FreezerNode<T>[];

    // From https://stackoverflow.com/a/53899815
    type OptionalPropertyOf<T> = Exclude<{
        [K in keyof T]: T extends Record<K, T[K]>
          ? never
          : K
      }[keyof T], undefined>
      
    type FreezerObject<T> = FreezerCommon<T> & {
        remove(a: OptionalPropertyOf<T>): FreezerObject<T>,
        remove(a: OptionalPropertyOf<T>[]): FreezerObject<T>,
    } & {
        [K in keyof T]-?: FreezerNode<T[K]>
    };

    // Definitions repeated for pivots
    export type FreezerNodePivoted<PivotType, T> = T extends Array<infer Type> ? FreezerArrayPivoted<PivotType, Type> : T extends string | number | boolean | null | undefined ? T : FreezerObjectPivoted<PivotType, T>;

    type FreezerCommonPivoted<PivotType, T> = FreezerListener & {
        getListener(): void,
        now(): void,
        pivot(): FreezerNodePivoted<T, T>,
        reset(a: FreezerNode<T>): FreezerNodePivoted<PivotType, PivotType>,
        run(): void,
        set(state: Partial<T>) : FreezerNodePivoted<PivotType, PivotType>;
        set<K extends keyof T>(key: K, value: Partial<T[K]>) : FreezerNodePivoted<PivotType, PivotType>;
        toJS(): T,
        transact(): void,
    }

    type FreezerArrayPivoted<PivotType, T> = FreezerCommonPivoted<PivotType, T> & {
        append(): FreezerNodePivoted<PivotType, PivotType>,
        pop(): T | undefined,
        prepend(): FreezerNodePivoted<PivotType, PivotType>,
        push(): FreezerNodePivoted<PivotType, PivotType>,
        shift(): FreezerNodePivoted<PivotType, PivotType>,
        sort(): FreezerNodePivoted<PivotType, PivotType>,
        splice(start: number, deleteCount: number, ...items: T[]): FreezerNodePivoted<PivotType, PivotType>,
        splice(start: number, deleteCount: number, item: T): FreezerNodePivoted<PivotType, PivotType>,
        splice(start: number, deleteCount?: number): FreezerNodePivoted<PivotType, PivotType>,
        unshift(): FreezerNodePivoted<PivotType, PivotType>,
    } & FreezerNodePivoted<PivotType, T>[];

    type FreezerObjectPivoted<PivotType, T> = FreezerCommonPivoted<PivotType, T> & {
        // remove(a: string): FreezerObject<Omit<T,a>>,
        remove(a: string): FreezerNodePivoted<PivotType, PivotType>,
        remove(a: string[]): FreezerNodePivoted<PivotType, PivotType>,
    } & {
        [K in keyof T]-?: FreezerNodePivoted<PivotType, T[K]>
    };

    export class Freezer<T> implements FreezerListener{
        constructor(a: T, b?: FreezerOptions);
        
        get() : FreezerNode<T>;
        set(state: T) : FreezerNode<T>;
        set(state: FreezerNode<T>) : FreezerNode<T>;
        
        getEventHub() : FreezerListener;

        // emit() : FreezerCommon<T>;
        getData() : FreezerCommon<T>;
        // off() : FreezerCommon<T>;
        // on() : FreezerCommon<T>;
        // once() : FreezerCommon<T>;
        set() : FreezerCommon<T>;
        setData() : FreezerCommon<T>;
        trigger() : FreezerCommon<T>; // deprecated
        new (a: Freezer<T>, b: FreezerOptions) : Freezer<T>;

        on:(eventName: string, cb: (...params:any[]) => void) => void;

        once:(eventName: string, cb: (...params:any[]) => void) => void;
        
        off:(eventName: string, cb: (...params:any[]) => void) => void;

        emit:(eventName:string, ...params:any[]) => void;


        // reset(newData:any):void;

        // getEventHub(): FreezerListener;

        // on(eventName: string, cb: (...params:any[]) => void) : void;

        // once(eventName: string, cb: (...params:any[]) => void) : void;
        // off(eventName: string, cb: (...params:any[]) => void) : void;
        // emit(eventName:string, ...params:any[]) : void;
    }

    export default Freezer;
}
