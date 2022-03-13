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
    '$username'
]);
console.log(__1.Compiler);
const t = new __1.Compiler('uwu $authorID uwuwuwuwu $authorID $username');
console.log((0, util_1.inspect)(t.start().getFunctions(), { colors: true, depth: 5 }));
const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000);
function perf() {
    const t = new __1.Compiler(code);
    const p = performance.now();
    t.start();
    console.log(`Parsed ${t["functions"].length} functions in string length ${code.length} in ${performance.now() - p}ms`);
    return perf;
}
perf()()()()();
//# sourceMappingURL=compiler.js.map