/**
 * @file compiler.cc
 * @brief 
 * @version 0.1
 * @date 2022-01-02
 * 
 * @copyright Copyright (c) 2022
 * 
 */

#include "compiler.h"
#include "util.h"
#include <napi.h>

using namespace Napi;
using namespace std;

Object Compiler::Init(Napi::Env env, Object exports) 
{
    Function func = DefineClass(
        env,
        "Compiler",
        {
            InstanceMethod("get_matched_functions", &Compiler::get_matched_functions),
            InstanceMethod("get_functions", &Compiler::get_functions),
            InstanceMethod("start", &Compiler::start),
            InstanceMethod("get_compiled_code", &Compiler::get_compiled_code)
        }
    );

    FunctionReference *constructor = new FunctionReference();
    *constructor = Persistent(func);

    exports.Set(
        "Compiler",
        func
    );
    
    return exports;
}

template<typename A, typename T, typename K>
vector<A> iterate_vector(vector<K>& vec, T lm)
{
    typename vector<K>::iterator it;
    vector<A> c;

    for (it = vec.begin();it != vec.end();++it) 
    {
        c.push_back(lm(*it));
    }

    return c;
}

Compiler::Compiler(CInfo info): ObjectWrap<Compiler>(info) 
{
    string code = info[0].As<String>();
    
    this->code = code;
    
    vector<RawFunctionData> vec;

    Result res = resolve_napi_functions_array(info.Env(), info[1].As<Array>(), vec);

    if (res == Result::Failed)
    {
        return;
    }
    
    this->sys = 0;

    this->fns = vec;

    if (!this->is_array_sorted())
    {
        Error::New(info.Env(), "Function array is not sorted.").ThrowAsJavaScriptException();
        return;
    }
 
    vector<string> frmt = iterate_vector<string>(vec, [](RawFunctionData i)
    {
        return "\\" + i.name;
    });

    string stringified("");

    join(frmt, "|", stringified);

    this->regexp = regex(
        "(" + stringified + ")"
    );

    this->len = this->code.size() - 1;
    this->current = -1;

    this->matches = match_functions(this->fns, this->regexp, this->code);
    this->flen = this->matches.size();
}

Compiler* Compiler::seek(size_t pos)
{
    this->current = pos;

    return this;
}

Compiler* Compiler::skip(size_t n) 
{
    return this->seek(this->current + n);
}

char& Compiler::letter() 
{
    return this->code[this->current];
}

char& Compiler::next() 
{
    return this->code[++this->current];
}

char& Compiler::peek() 
{
    return this->code[this->current + 1];
}

bool Compiler::eof() 
{
    return this->current == this->len;
}

bool Compiler::is_closure_bracket(char& c) 
{
    return c == ']';
}

bool Compiler::is_dollar(char& c) 
{
    return c == '$';
}

bool Compiler::is_open_bracket(char& c)
{
    return c == '[';
}

Value Compiler::get_functions(CInfo info)
{
    Napi::Env env = info.Env();

    Array arr = Array::New(env);

    size_t len = 0;

    vector<FunctionData>::iterator it;
    for (it = this->functions.begin();it != this->functions.end();++it)
    {
        FunctionData val = *it;

        Object obj = function_to_napi_object(env, val);

        arr.Set(len++, obj);
    }

    return arr;
}

Napi::Value Compiler::get_matched_functions(CInfo info) 
{
    Napi::Env env = info.Env();

    Array arr = Array::New(env);

    vector<MatchedFunctionData>::iterator it;

    size_t len = 0;

    for (it = this->matches.begin();it != this->matches.end();++it) 
    {
        MatchedFunctionData val = *it;

        Object obj = Object::New(env);

        obj.Set("name", val.name);

        obj.Set("position", val.position);

        obj.Set("size", val.size);

        arr.Set(len++, obj);
    }

    return arr;
}

void Compiler::shift() 
{
    this->flen--;
    this->matches.erase(this->matches.begin());
}

MatchedFunctionData Compiler::get_indexed_function() 
{
    if (this->flen == 0) return this->create_match_function("");

    int64_t index = this->current;
    MatchedFunctionData match = this->matches[0];

    if (match.position == index) return match;

    return this->create_match_function("");
}

MatchedFunctionData Compiler::create_match_function(string name)
{
    return MatchedFunctionData {
        name,
        0,
        0,
        {
            false,
            false,
            ""
        }
    };
}

Value Compiler::get_compiled_code(CInfo info) 
{
    return String::New(info.Env(), this->code);
}

string Compiler::system_id() 
{
    return "SYSTEM_FUNCTION(" + to_string(this->sys++) + ")";
}

FunctionData Compiler::create_function(string name) 
{
    return FunctionData {
        name,
        this->system_id(),
        {},
        "",
        {}
    };
}

bool Compiler::is_semicolon(char& c)
{
    return c == ';';
}

FieldReaderResult Compiler::read_function_fields(Napi::Env env, FunctionData& ref)
{
    string inside("");
    bool escaped(false);

    do {
        char letter = this->next();

        if (this->is_closure_bracket(letter))
        {
            if (escaped)
            {
                escaped = false;
                inside += letter;
                continue;
            }

            ref.fields.push_back(inside);
            inside.clear();

            join(ref.fields, ";", inside);
            
            ref.inside = inside;
            return FieldReaderResult::Success;
        }
        else if (this->is_dollar(letter))
        {
            auto fn = this->get_indexed_function();

            if (this->is_empty(fn.name)) 
            {
                escaped = false;
                inside += letter;
                continue;
            }

            this->shift();

            if (escaped)
            {
                escaped = false;
                inside += letter;
                continue;
            }
            
            FunctionData f = this->read_function(env, fn);

            if (this->is_empty(f.name))
            {
                return FieldReaderResult::Failed;
            }

            ref.overloads.push_back(f);

            inside += f.id;
        }
        else if (this->is_semicolon(letter)) 
        {
            if (escaped)
            {
                escaped = false;
                inside += letter;
                continue;
            }
            
            ref.fields.push_back(inside);
            inside.clear();
        }
        else if (this->is_escape_char(letter))
        {
            if (escaped)
            {
                inside += letter;
                escaped = false;
                continue;
            }
            escaped = true;
        }
        else
        {
            escaped = false;
            inside += letter;
        }
    } while (!this->eof());

    Error::New(env, "Function " + ref.name + "[" + inside + "... has no closure bracket.").ThrowAsJavaScriptException();

    return FieldReaderResult::Failed;
}

FunctionData Compiler::read_function(Napi::Env env, MatchedFunctionData& func) 
{
    FunctionData fn = this->create_function(func.name);

    this->skip(func.size);

    if (func.ref.brackets) 
    {
        char peek = this->peek();

        if (this->is_open_bracket(peek))
        {
            this->skip(1);
            
            if (this->eof()) 
            {
                Error::New(env, "Function " + fn.name + " has no closure bracket.").ThrowAsJavaScriptException();
                return this->create_function("");
            }

            FieldReaderResult res = this->read_function_fields(env, fn);

            if (res == FieldReaderResult::Failed) 
            {
                return this->create_function("");
            }
        }
        else if (!func.ref.optional)
        {
            Error::New(env, "Function " + func.name + " requires brackets.").ThrowAsJavaScriptException();
            return this->create_function("");
        }
    }
    
    return fn;
}

bool Compiler::is_array_sorted() 
{
    vector<RawFunctionData>::iterator it;
    size_t max = 0;

    for (it = this->fns.begin();it != this->fns.end();++it)
    {
        size_t s = it->name.size();
        if (s <= max || max == 0) {
            max = s;
            continue;
        }
        return false;
    }

    return true;
}

bool Compiler::is_escape_char(char& c)
{
    return c == '\\';
}

bool Compiler::is_empty(string s) 
{
    return s == "";
}

Napi::Value Compiler::start(CInfo info) 
{
    if (this->flen == 0) return this->Value();

    Napi::Env env = info.Env();

    bool escaped(false);
    string code("");

    do {
        char letter = this->next();

        if (this->is_dollar(letter)) 
        {
            auto fn = this->get_indexed_function();

            if (this->is_empty(fn.name)) 
            {
                escaped = false;
                code += letter;
                continue;
            }

            this->shift();
            
            if (escaped)
            {
                escaped = false;
                code += letter;
                continue;
            }

            FunctionData f = this->read_function(env, fn);

            if (this->is_empty(f.name))
            {
                return this->Value();
            }

            this->functions.push_back(f);

            code += f.id;
        } 
        else if (this->is_escape_char(letter))
        {
            if (escaped)
            {
                code += letter;
                escaped = false;
                continue;
            }
            escaped = true;
        }
        else
        {
            escaped = false;
            code += letter;
        }
    } while (!this->eof());

    this->code = code;

    return this->Value();
}