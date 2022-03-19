/**
 * Data that can be passed to functions.
 */
export interface RawFunctionData {
    /**
     * The name of the function.
     */
    name: string;
    /**
     * Whether this function uses brackets.
     * @default true
     */
    brackets?: boolean;
    /**
     * Whether this function's brackets are optional.
     * @default true
     */
    optional?: boolean;
}
/**
 * Represents matched functions by regex.
 */
export interface MatchedFunctionData {
    /**
     * The name of the function.
     */
    name: string;
    brackets: boolean | null;
    /**
     * The position of the function in the code.
     */
    position: number;
    /**
     * The size of the function.
     * @private
     */
    size: number;
}
/**
 * Represents a function's field.
 */
export interface FieldData {
    /**
     * The value of the field.
     */
    value: string;
    /**
     * The functions used in this field.
     */
    overloads: FunctionData[];
}
/**
 * Represents the data of a function.
 */
export interface FunctionData {
    /**
     * The name of the function.
     */
    name: string;
    /**
     * The data inside the function.
     */
    inside: null | string;
    /**
     * The fields of this function.
     */
    fields: FieldData[];
    /**
     * The function id.
     */
    id: string;
}
export interface Position {
    column: number;
    line: number;
}
export declare function iterate<K, R>(iterable: IterableIterator<K>, fn: (el: K) => R): R[];
export declare type RawFunctionUnion = string[] | RawFunctionData[] | (string[] | RawFunctionData[]);
/**
 * The main instance of a compiler.
 */
export declare class Compiler<T extends unknown & {
    toString(): string;
}> {
    #private;
    static insensitive: boolean;
    static BRACKET_FUNCTIONS: Record<string, true | null>;
    static FUNCTIONS: Array<string | RawFunctionData> | null;
    private static REGEX;
    private code;
    private index;
    private reference?;
    private functions;
    result: string;
    /**
     * Instantiates a new compiler.
     * @param code The code to compile.
     */
    constructor(code: string, reference?: T);
    getMatchedFunctions(): MatchedFunctionData[];
    private get systemID();
    static setFunctions(fns: Array<string | RawFunctionData>, insensitive?: boolean): boolean;
    skip(n: number): void;
    isDollar(s: string): boolean;
    readFunctionFields(raw: MatchedFunctionData): FunctionData;
    /**
     * Returns the compiled code.
     */
    getCompiledCode(): string;
    push(str: string): this;
    /**
     * Compiles the code.
     */
    start(): this;
    back(): string;
    isBracketOpen(t: string): boolean;
    isBracketClosure(t: string): boolean;
    isSemicolon(t: string): boolean;
    isEscapeChar(t: string): boolean;
    private getPosition;
    private throw;
    at(i: number): string | null;
    parseFunction(allow?: boolean): FunctionData | null | string;
    createFunction(name: string, inside?: null | string, fields?: FieldData[]): FunctionData;
    peek(): string | null;
    next(): string | null;
    char(): string | null;
    eof(): boolean;
    /**
     * Gets functions used in the code.
     */
    getFunctions(): FunctionData[];
}
export declare class CompileError extends Error {
    constructor(err: string);
}
//# sourceMappingURL=index.d.ts.map