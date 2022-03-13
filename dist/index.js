"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = exports.iterate = void 0;
function iterate(iterable, fn) {
    let item;
    const arr = new Array();
    while (item = iterable.next()) {
        if (item.done) {
            break;
        }
        arr.push(fn(item.value));
    }
    return arr;
}
exports.iterate = iterate;
function getString(c) {
    return typeof c === 'string' ? c : c.name;
}
/**
 * The main instance of a compiler.
 */
class Compiler {
    static BRACKET_FUNCTIONS = {};
    static FUNCTIONS = null;
    static REGEX = null;
    code;
    index = 0;
    functions = new Array();
    #matches;
    #id = 0;
    result = '';
    /**
     * Instantiates a new compiler.
     * @param code The code to compile.
     */
    constructor(code) {
        this.code = code;
        this.#matches = this.getMatchedFunctions();
    }
    getMatchedFunctions() {
        const matches = this.code.matchAll(Compiler.REGEX);
        return iterate(matches, (el) => {
            const has = Compiler.BRACKET_FUNCTIONS[el[0]];
            const brackets = has === undefined ? false : has;
            return {
                name: el[0],
                brackets,
                position: el.index,
                size: el[0].length
            };
        });
    }
    get systemID() {
        return `SYSTEM_FUNCTION(${this.#id++})`;
    }
    static setFunctions(fns) {
        if (Compiler.FUNCTIONS !== null)
            return false;
        Compiler.FUNCTIONS = fns.sort((x, y) => getString(y).length - getString(x).length);
        for (let i = 0, len = Compiler.FUNCTIONS.length; i < len; i++) {
            const fn = Compiler.FUNCTIONS[i];
            if (typeof fn === 'string') {
                continue;
            }
            if (!fn.brackets)
                continue;
            this.BRACKET_FUNCTIONS[fn.name] = fn.optional ? null : true;
        }
        Compiler.REGEX = new RegExp(fns.map(c => typeof c === 'string' ? `\\${c}` : `\\${c.name}`).join('|'), 'gm');
        return true;
    }
    skip(n) {
        this.index += n;
    }
    isDollar(s) {
        return s === '$';
    }
    readFunctionFields(name) {
        let closed = false;
        let escape = false;
        this.skip(1);
        let len = 0;
        const ref = this.createFunction(name, '', [
            {
                value: '',
                overloads: []
            }
        ]);
        while (!this.eof()) {
            const char = this.next();
            if (escape) {
                ref.inside += char;
                ref.fields[len].value += char;
                escape = false;
                continue;
            }
            if (this.isEscapeChar(char)) {
                escape = true;
                continue;
            }
            else if (this.isDollar(char)) {
                if (this.#matches.length !== 0 && this.#matches[0].position === this.index - 1) {
                    this.index--;
                    const fn = this.parseFunction();
                    ref.inside += fn.id;
                    ref.fields[len].value += fn.id;
                    ref.fields[len].overloads.push(fn);
                }
                else {
                    ref.inside += char;
                    ref.fields[len].value += char;
                }
            }
            else if (this.isBracketClosure(char)) {
                closed = true;
                break;
            }
            else if (this.isSemicolon(char)) {
                ref.inside += char;
                len++;
                ref.fields.push({
                    value: '',
                    overloads: []
                });
            }
            else {
                ref.inside += char;
                ref.fields[len].value += char;
            }
        }
        if (!closed) {
            throw new Error(`${name} is missing closure bracket.`);
        }
        return ref;
    }
    /**
     * Returns the compiled code.
     */
    getCompiledCode() {
        return this.result;
    }
    push(str) {
        this.result += str;
        return this;
    }
    /**
     * Compiles the code.
     */
    start() {
        while (!this.eof()) {
            const got = this.parseFunction();
            typeof got === 'string' ?
                this.push(got)
                : got === null ?
                    this.push(this.code.slice(this.index, -1))
                    : (this.functions.push(got),
                        this.push(got.id));
        }
        return this;
    }
    back() {
        return this.code[this.index - 1];
    }
    isBracketOpen(t) {
        return t === '[';
    }
    isBracketClosure(t) {
        return t === ']';
    }
    isSemicolon(t) {
        return t === ';';
    }
    isEscapeChar(t) {
        return t === '\\';
    }
    parseFunction() {
        const next = this.#matches.shift();
        if (!next)
            return null;
        const old = this.index;
        this.index = next.position;
        this.result += this.code.slice(old, this.index);
        this.index += next.size;
        if (this.isEscapeChar(this.back())) {
            return next.name;
        }
        if (next.brackets === false) {
            return this.createFunction(next.name);
        }
        else if (next.brackets === true) {
            if (!this.isBracketOpen(this.char())) {
                throw new Error(`${next.name} requires brackets.`);
            }
            return this.readFunctionFields(next.name);
        }
        else {
            if (this.isBracketOpen(this.peek())) {
                return this.readFunctionFields(next.name);
            }
            else {
                return this.createFunction(next.name);
            }
        }
    }
    createFunction(name, inside = null, fields = []) {
        return {
            name,
            id: this.systemID,
            fields,
            inside
        };
    }
    peek() {
        return this.code[this.index + 1] ?? null;
    }
    next() {
        return this.code[this.index++] ?? null;
    }
    char() {
        return this.code[this.index] ?? null;
    }
    eof() {
        return this.char() === null;
    }
    /**
     * Gets functions used in the code.
     */
    getFunctions() {
        return this.functions;
    }
    reset() {
        return this;
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=index.js.map