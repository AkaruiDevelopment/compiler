import { inspect } from "util";
import { Compiler } from "..";

Compiler.setFunctions([
    {
        name: '$sum',
        brackets: true 
    },
    '$authorID',
    {
        name: '$onlyIf',
        brackets: true
    },
    {
        name: '$djsEval',
        brackets: true
    },
    {
        name: '$message',
        brackets: true,
        optional: true 
    },
    {
        name: '$username'
    }
], true)

console.log(Compiler)

const t = new Compiler(`$autHorId $djsEval`, 'owa')

console.log(inspect(t.start(), { colors: true, depth: 5 }))

const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000)

function perf() {
    const c = new Compiler(code)
    const t = performance.now()
    c.start()
    console.log(`${performance.now() -t}ms to parse ${c["functions"].length} functions in string of ${code.length} characters`)
    return perf 
}
