const { Compiler, sort_array } = require("../index")
const { inspect } = require('util')
function sorter(x, y) {
    return x.length < y.length;
}

const mycode = `my code $author[ok;tmr $authorID]`

const myfunctions = sort_array(
    [
        {
            name: "$authorID",
            brackets: false,
            optional: false
        },
        {
            name: "$author",
            brackets: true,
            optional: false
        }
    ]
)

const compiler = new Compiler(mycode, myfunctions)


compiler.start()
console.log(
    compiler.get_matched_functions(),
    { code: compiler.get_compiled_code() },
    inspect(compiler.get_functions(), { depth: 10, colors: true })
)
