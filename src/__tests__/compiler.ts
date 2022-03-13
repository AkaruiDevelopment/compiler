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
    }
])

console.log(Compiler)

const t = new Compiler(`$onlyIf[$includes[$clientOwnerID[|];$authorID]==true;nty]
Output: \`\`\`js
$djsEval[true;$message]\`\`\``)

console.log(inspect(t.start(), { colors: true, depth: 5 }))

const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000)
