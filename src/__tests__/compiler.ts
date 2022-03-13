import { inspect } from "util";
import { Compiler } from "..";

Compiler.setFunctions([
    {
        name: '$sum',
        brackets: true 
    },
    '$authorID',
    '$username'
])

console.log(Compiler)

const t = new Compiler('uwu $authorID uwuwuwuwu $authorID $username')

console.log(inspect(t.start().getFunctions(), { colors: true, depth: 5 }))

const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000)

function perf() {
    const t = new Compiler(code)
    const p = performance.now()
    t.start()
    console.log(`Parsed ${t["functions"].length} functions in string length ${code.length} in ${performance.now() - p}ms`)
    return perf 
}

perf()()()()()