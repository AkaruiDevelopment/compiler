const { sort_array } = require("../index")

const uwu = [
    "tmr",
    "ok",
    "o",
    "o",
    "uwuw",
    "tmr",
    "ok",
    "o",
    "o",
    "uwuw",
    "tmr",
    "ok",
    "o",
    "o",
    "uwuw"
].map(c => ({ name: c }))

console.log(
    sort_array(uwu)
)