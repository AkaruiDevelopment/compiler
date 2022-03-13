import { fork } from "child_process"

fork(`./dist/__tests__/${process.argv[2] ?? 'test'}.js`)