import { inspect } from "util";
import { Compiler } from "..";

Compiler.setFunctions([
    {
        name: '$sum',
        brackets: true 
    },
    '$authorID',
    {
        name: '$username',
        optional: true,
        brackets: true
    }
])

console.log(Compiler)

const t = new Compiler('$authorID ok $username[ok;$sum[1;2] tmr]')

console.log(inspect(t.start(), { colors: true, depth: 5 }))

const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000)
