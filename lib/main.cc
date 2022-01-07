#include <napi.h>
#include "compiler.h"
#include "util.h"

using namespace Napi;

Object Init(Env env, Object exports) 
{
    exports.Set(
        "sort_array",
        Function::New(env, sort_array)
    );
    
    Compiler::Init(env, exports);
    return exports;
}

NODE_API_MODULE(main, Init)