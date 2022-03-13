"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
(0, child_process_1.fork)(`./dist/__tests__/${process.argv[2] ?? 'test'}.js`);
//# sourceMappingURL=runner.js.map