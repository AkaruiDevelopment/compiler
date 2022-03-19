import exp from "constants"

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

    brackets: boolean | null 

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
}

export interface Position {
    column: number
    line: number
}

export function iterate<K, R>(iterable: IterableIterator<K>, fn: (el: K) => R): R[] {
    let item: ReturnType<typeof iterable["next"]>
    const arr = new Array<R>()

    while (item = iterable.next()) {
        if (item.done) {
            break
        }

        arr.push(fn(item.value))
    }

    return arr 
}

function getString(c: RawFunctionData | string): string {
    return typeof c === 'string' ? c : c.name
}

export type RawFunctionUnion = string[] | RawFunctionData[] | (string[] | RawFunctionData[])

/**
 * The main instance of a compiler.
 */
export class Compiler<T extends unknown & { toString(): string }> {
    static insensitive = false
    static BRACKET_FUNCTIONS: Record<string, true | null> = {}
    static FUNCTIONS: Array<string | RawFunctionData> | null = null 
    private static REGEX: RegExp | null = null

    private code: string
    private index = 0
    private reference?: T
    private functions = new Array<FunctionData>()

    #matches: MatchedFunctionData[]
    #id = 0

    result = ''

    /**
     * Instantiates a new compiler.
     * @param code The code to compile.
     */
    constructor(code: string, reference?: T) {
        this.code = code
        this.reference = reference
        this.#matches = this.getMatchedFunctions()
    }

    getMatchedFunctions(): MatchedFunctionData[] {
        const matches = this.code.matchAll(Compiler.REGEX!)
        return iterate(matches, (el) => {
            const name = Compiler.insensitive ? getString(Compiler.FUNCTIONS!.find(c => getString(c).toLowerCase() === el[0].toLowerCase())!) : el[0]

            const has = Compiler.BRACKET_FUNCTIONS[name]

            const brackets = has === undefined ? false : has 

            return {
                name,
                brackets,
                position: el.index!,
                size: el[0].length
            }
        })
    }

    private get systemID() {
        return `SYSTEM_FUNCTION(${this.#id++})`
    }

    static setFunctions(fns: Array<string | RawFunctionData>, insensitive = false) {
        if (Compiler.FUNCTIONS !== null) return false
        
        Compiler.FUNCTIONS = fns.sort(
            (x, y) => getString(y).length - getString(x).length
        ) 

        for (let i = 0, len = Compiler.FUNCTIONS.length;i < len;i++) {
            const fn = Compiler.FUNCTIONS[i]
            if (typeof fn === 'string') {
                continue
            }

            if (!fn.brackets) continue
            
            this.BRACKET_FUNCTIONS[fn.name] = fn.optional ? null : true
        }

        Compiler.insensitive = insensitive

        Compiler.REGEX = new RegExp(fns.map(
            c => typeof c === 'string' ? `\\${c}` : `\\${c.name}` 
        ).join('|'), `gm${insensitive ? 'i' : ''}`)

        return true 
    }

    skip(n: number) {
        this.index += n
    }

    isDollar(s: string) {
        return s === '$'
    }

    readFunctionFields(raw: MatchedFunctionData): FunctionData {
        let closed = false
        let escape = false
        
        this.skip(1)

        let len = 0

        const ref = this.createFunction(raw.name, '', [
            {
                value: '',
                overloads: []
            }
        ])

        while (!this.eof()) {
            const char = this.next()!

            if (escape) {
                ref.inside += char
                ref.fields[len].value += char
                escape = false 
                continue
            }
            
            if (this.isEscapeChar(char)) {
                escape = true 
                continue
            } else if (this.isDollar(char)) {
                if (this.#matches.length !== 0 && this.#matches[0].position === this.index - 1) {
                    this.index--
                    const fn = this.parseFunction(false) as FunctionData 
                    ref.inside += fn.id
                    ref.fields[len].value += fn.id 
                    ref.fields[len].overloads.push(fn)
                } else {
                    ref.inside += char 
                    ref.fields[len].value += char 
                }
            } else if (this.isBracketClosure(char)) {
                closed = true
                break
            } else if (this.isSemicolon(char)) {
                ref.inside += char 
                len++
                ref.fields.push(
                    {
                        value: '',
                        overloads: []
                    }
                )
            } else {
                ref.inside += char
                ref.fields[len].value += char
            }
        }

        if (!closed) {
            this.throw(raw, `${name} is missing closure bracket`)
        }

        return ref 
    }

    /**
     * Returns the compiled code.
     */
    getCompiledCode(): string {
        return this.result
    }

    push(str: string) {
        this.result += str 

        return this 
    }

    /**
     * Compiles the code.
     */
    start() {
        if (!this.#matches.length) {
            this.result = this.code 
            return this 
        }

        while (!this.eof()) {
            const got = this.parseFunction()
            typeof(got) === 'string' ?
                this.push(got)
            : got === null ? (
                this.push(this.code.slice(this.index)),
                this.index = this.code.length
            ) : (
                this.functions.push(got),
                this.push(got.id)
            )
        }
        
        return this 
    }

    back(): string {
        return this.code[this.index - 1] 
    }

    isBracketOpen(t: string) {
        return t === '['
    }

    isBracketClosure(t: string) {
        return t === ']'
    }

    isSemicolon(t: string) {
        return t === ';'
    }

    isEscapeChar(t: string) {
        return t === '\\'
    }

    private getPosition(ref: MatchedFunctionData): Position {
        let start = 0

        const pos: Position = {
            line: 1,
            column: 0
        }

        const limit = ref.position + 1

        while (start !== limit) {
            const char = this.code[start++]

            char === '\n' ? (
                pos.line++,
                pos.column = 0
            ) : pos.column++
        }

        return pos 
    }

    private throw<T>(ref: MatchedFunctionData, err: string): T {
        const pos = this.getPosition(ref)
        throw new CompileError(`${err} at ${pos.line}:${pos.column} ${this.reference ? `(from ${this.reference.toString()})` : ''}`)
    }

    at(i: number): string | null {
        return this.code[i] ?? null 
    }

    parseFunction(allow = true): FunctionData | null | string {
        const next = this.#matches.shift()
        if (!next) return null 

        const old = this.index

        this.index = next.position

        const isEscapeChar = this.back() === '\\'

        if (allow) {
            this.result += this.code.slice(old, isEscapeChar ? this.index - 1 : this.index)
        }

        this.index += next.size

        return isEscapeChar ? 
            next.name : next.brackets === false ? 
                this.createFunction(next.name) : 
                next.brackets === true ?
                    !this.isBracketOpen(this.char()!) ? this.throw(next, `${next.name} requires brackets`) :
                    this.readFunctionFields(next) :
                !this.isBracketOpen(this.char()!) ? this.createFunction(next.name) :
                this.readFunctionFields(next)
    }

    createFunction(name: string, inside: null | string = null, fields: FieldData[] = []): FunctionData {
        return {
            name,
            id: this.systemID,
            fields,
            inside
        }
    }

    peek(): string | null {
        return this.code[this.index + 1] ?? null
    }

    next(): string | null {
        return this.code[this.index++] ?? null 
    }

    char(): string | null {
        return this.code[this.index] ?? null 
    }

    eof() {
        return this.char() === null 
    }

    /**
     * Gets functions used in the code.
     */
    getFunctions(): FunctionData[] {
        return this.functions
    }
}

export class CompileError extends Error {
    constructor(err: string) {
        super(err)
    }
}