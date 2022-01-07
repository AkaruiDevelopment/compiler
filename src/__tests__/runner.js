const { fork } = require("child_process");

fork(`./src/__tests__/${process.argv[2] ?? 'test'}.js`)