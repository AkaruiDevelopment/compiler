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
export class Compiler {
    static BRACKET_FUNCTIONS: Record<string, true | null> = {}
    static FUNCTIONS: Array<string | RawFunctionData> | null = null 
    private static REGEX: RegExp | null = null

    private code: string
    private index = 0
    private functions = new Array<FunctionData>()

    #matches: MatchedFunctionData[]
    #id = 0

    result = ''
    
    /**
     * Instantiates a new compiler.
     * @param code The code to compile.
     */
    constructor(code: string) {
        this.code = code
        this.#matches = this.getMatchedFunctions()
    }

    getMatchedFunctions(): MatchedFunctionData[] {
        const matches = this.code.matchAll(Compiler.REGEX!)
        return iterate(matches, (el) => {
            const has = Compiler.BRACKET_FUNCTIONS[el[0]]

            const brackets = has === undefined ? false : has 

            return {
                name: el[0],
                brackets,
                position: el.index!,
                size: el[0].length
            }
        })
    }

    private get systemID() {
        return `SYSTEM_FUNCTION(${this.#id++})`
    }

    static setFunctions(fns: Array<string | RawFunctionData>) {
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

        Compiler.REGEX = new RegExp(fns.map(
            c => typeof c === 'string' ? `\\${c}` : `\\${c.name}` 
        ).join('|'), 'gm')

        return true 
    }

    skip(n: number) {
        this.index += n
    }

    isDollar(s: string) {
        return s === '$'
    }

    readFunctionFields(name: string): FunctionData {
        let closed = false
        let escape = false
        
        this.skip(1)

        let len = 0

        const ref = this.createFunction(name, '', [
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
                    const fn = this.parseFunction() as FunctionData
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
            throw new Error(`${name} is missing closure bracket.`)
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
        while (!this.eof()) {
            const got = this.parseFunction()
            typeof got === 'string' ?
                this.push(got)
            : got === null ? (
                this.push(this.code.slice(this.index, -1)),
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

    parseFunction(): FunctionData | null | string {
        const next = this.#matches.shift()
        if (!next) return null 

        const old = this.index
        this.index = next.position

        this.result += this.code.slice(old, this.index)

        this.index += next.size
        
        if (this.isEscapeChar(this.back())) {
            return next.name
        }

        if (next.brackets === false) {
            return this.createFunction(next.name)
        } else if (next.brackets === true) {
            if (!this.isBracketOpen(this.char()!)) {
                throw new Error(`${next.name} requires brackets.`)
            }

            return this.readFunctionFields(next.name)
        } else {
            if (this.isBracketOpen(this.peek()!)) {
                return this.readFunctionFields(next.name)
            } else {
                return this.createFunction(next.name)
            }
        }
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