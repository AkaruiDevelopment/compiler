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
        name: '$username',
        optional: true,
        brackets: true
    }
]);
console.log(__1.Compiler);
const t = new __1.Compiler('1$username');
console.log((0, util_1.inspect)(t.start(), { colors: true, depth: 5 }));
const code = "uwu $authorID uwuwuwuwu $authorID $username $authorID $username".repeat(1000);
//# sourceMappingURL=compiler.js.map