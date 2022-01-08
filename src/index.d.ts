/**
 * Data that can be passed to functions.
 */
export interface RawFunctionData {
    /**
     * The name of the function.
     */
    name: string

    /**
     * Whether this function uses brackets.
     * @default true
     */
    brackets?: boolean

    /**
     * Whether this function's brackets are optional.
     * @default true
     */
    optional?: boolean
}

/**
 * Represents matched functions by regex.
 */
export interface MatchedFunctionData {
    /**
     * The name of the function.
     */
    name: string

    /**
     * The position of the function in the code.
     */
    position: number

    /**
     * The size of the function.
     * @private
     */
    size: number
}

/**
 * Represents a function's field.
 */
export interface FieldData {
    /**
     * The value of the field.
     */
    value: string

    /**
     * The functions used in this field.
     */
    overloads: FunctionData[]
}

/**
 * Represents the data of a function.
 */
export interface FunctionData {
    /**
     * The name of the function.
     */
    name: string

    /**
     * The data inside the function.
     */
    inside: null | string

    /**
     * The fields of this function.
     */
    fields: FieldData[]

    /**
     * The function id.
     */
    id: string

    /**
     * All the functions used inside the function.
     * @deprecated This property does not exist anymore.
     */
    overloads: FunctionData[]
}

/**
 * The main instance of a compiler.
 */
export class Compiler {

    /**
     * Instantiates a new compiler.
     * @param code The code to compile.
     * @param fns The functions to recognize.
     */
    constructor(code: string, fns: Array<string | RawFunctionData>)

    /**
     * Returns the compiled code.
     */
    public get_compiled_code(): string;

    /**
     * Compiles the code.
     */
    public start(): this

    /**
     * Gets matched functions by regex.
     */
    public get_matched_functions(): MatchedFunctionData[];

    /**
     * Gets functions used in the code.
     */
    public get_functions(): FunctionData[];

    /**
     * Resets the compiler.
     * @deprecated This method does not exist anymore.
     */
    public reset(): this
}

export const path: string

export type RawFunctionUnion = string[] | RawFunctionData[] | (string[] | RawFunctionData[])

/**
 * Sorts an array of functions.
 * @param arr The functions to sort.
 */
export function sort_array<T extends RawFunctionUnion>(arr: T): T