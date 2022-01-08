const { Compiler, sort_array } = require("../index")

function sorter(x, y) {
    return x.length < y.length;
}

const mycode = `my code $authorID[bro] $author`

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

console.log(
    compiler.get_matched_functions(),
    void compiler.start(),
    { code: compiler.get_compiled_code() },
    compiler.get_functions()
)
