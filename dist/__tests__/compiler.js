"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const __1 = require("..");
__1.Compiler.setFunctions([
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
], true);
console.log(__1.Compiler);
const t = new __1.Compiler(`$autHorId $djsEval`, 'owa');
console.log((0, util_1.inspect)(t.start(), { colors: true, depth: 5 }));
const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000);
function perf() {
    const c = new __1.Compiler(code);
    const t = performance.now();
    c.start();
    console.log(`${performance.now() - t}ms to parse ${c["functions"].length} functions in string of ${code.length} characters`);
    return perf;
}
//# sourceMappingURL=compiler.js.map