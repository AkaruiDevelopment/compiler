#include "util.h"

#include <vector>
#include <napi.h>
#include <string>
#include <regex>
#include <iostream>

using namespace Napi;
using namespace std;

Result resolve_napi_functions_array(Napi::Env env, Napi::Array arr, vector<RawFunctionData>& dst)
{
    for (unsigned int i = 0;i < arr.Length();++i)
    {
        Value val = arr.Get(i);

        if (val.IsString()) 
        {
            dst.push_back(
                RawFunctionData {
                    true,
                    true,
                    val.As<String>()
                }
            );
        }
        else if (val.IsObject())
        {
            Object v = val.As<Object>();
            Value brackets = v.Get("brackets");
            Value name = v.Get("name");
            Value optional = v.Get("optional");

            if (optional.IsUndefined())
            {
                optional = Boolean::New(env, true);
            }

            if (brackets.IsUndefined())
            {
                brackets = Boolean::New(env, true);
            }

            if (name.IsUndefined())
            {
                TypeError::New(env, "No function name was given.").ThrowAsJavaScriptException();
                return Result::Failed;
            }

            dst.push_back(
                RawFunctionData {
                    brackets.As<Boolean>(),
                    optional.As<Boolean>(),
                    name.As<String>()
                }
            );
        }
        else 
        {
            TypeError::New(env, "Unknown function received in array.").ThrowAsJavaScriptException();
            return Result::Failed;
        }
    }

    return Result::Success;
}

string get_string(Napi::Value val)
{
    if (val.IsString())
    {
        return val.As<String>();
    } 
    else 
    {
        return val.As<Object>().Get("name").As<String>();
    }
    throw runtime_error("Could not get string from napi value.");
}

Napi::Array sort_array(CInfo info) 
{
    Array arr = info[0].As<Array>();

    for (int i = 0;i < (int) arr.Length() - 1;++i)
    {
        Value rawl = arr.Get(i);
        Value rawr = arr.Get(i + 1);

        string left = get_string(rawl);
        string right = get_string(rawr);
        
        if (right.size() > left.size())
        {
            arr.Set(i, rawr);
            arr.Set(i + 1, rawl);
            i -= 2;
            if (i < 0) i = -1;
        }
    }

    return arr;
}

vector<FunctionData> filter_overloads_for(FunctionData& ref, string& code)
{
    vector<FunctionData> vc;
    vector<FunctionData>::iterator it;

    for (it = ref.overloads.begin();it != ref.overloads.end();++it)
    {
        FunctionData fn = *it;
        if (code.find(fn.id) != string::npos) 
        {
            vc.push_back(fn);
        }
    }

    return vc;
}

template<typename T, typename K>
Napi::Array vec_to_napi_array(Napi::Env env, vector<T> vec, K lm)
{
    Napi::Array arr = Napi::Array::New(env);

    size_t len = 0;

    typename vector<T>::iterator it;
    for (it = vec.begin();it != vec.end();++it) 
    {
        arr.Set(len++, lm(*it));
    }

    return arr;
}

Napi::Object function_to_napi_object(Napi::Env env, FunctionData func)
{
    Napi::Object obj = Napi::Object::New(env);

    Value inside = func.fields.size() == 0 ? env.Null() : Napi::String::New(env, func.inside);

    obj.Set("name", func.name);
    obj.Set("id", func.id);
    obj.Set(
        "fields",
        vec_to_napi_array(env, func.fields, [env, &func](string fld)
        {
            Object obj = Object::New(env);

            obj.Set("value", fld);
            obj.Set("overloads", vec_to_napi_array(
                env, filter_overloads_for(func, fld), [env](FunctionData ref)
                {
                    return function_to_napi_object(env, ref);
                }
            ));

            return obj;
        })
    );
    obj.Set(
        "inside",
        inside
    );

    return obj;
}

void overloads_to_napi_array(Napi::Env env, Napi::Array& ref, FunctionData func)
{
    size_t len = 0;

    vector<FunctionData>::iterator it;
    for (it = func.overloads.begin();it != func.overloads.end();++it)
    {
        FunctionData overload = *it;

        ref.Set(len++, function_to_napi_object(env, overload));
    }
}

void join(vector<string>& vec, string delimiter, string& location) {
    vector<string>::iterator it;
    vector<string>::iterator end = vec.end();

    for (it = vec.begin();it != end;++it) 
    {
        location += *it;
        if (it != end - 1)
        {
            location += delimiter;
        }
    }
}

string generate_string(size_t s)
{
    string str("");
    while (s-- > 0) {
        str += rand() % 255;
    }
    return str;
}

template<typename T, typename K, typename C>
T find_in_vector(vector<K>& v, C l)
{
    typename vector<K>::iterator it;
    for (it = v.begin();it != v.end();++it)
    {
        bool res = l(*it);
        if (res)
        {
            return *it;
        }
    }
    throw runtime_error("Could not find function used.");
}

vector<MatchedFunctionData> match_functions(vector<RawFunctionData>& fns, regex reg, string code) 
{
    sregex_iterator it;
    vector<MatchedFunctionData> vec;
    
    for (it = sregex_iterator(code.begin(), code.end(), reg);it != sregex_iterator();++it) {
        smatch match = *it;
        
        string fn = match.str(1);

        RawFunctionData f = find_in_vector<RawFunctionData>(fns, [fn](RawFunctionData r)
        {
            return r.name == fn;
        });
        
        
        vec.push_back({
            fn,
            static_cast<size_t>(match.position(1)),
            fn.size() - 1,
            f
        });
    }

    return vec;
}

void napi_array_to_vec(Napi::Array arr, vector<string>& ptr) 
{
    for (unsigned int i = 0, len = arr.Length();i < len;++i) 
    {
        ptr.push_back(arr.Get(i).As<Napi::String>());
    }
}