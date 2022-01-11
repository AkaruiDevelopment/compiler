#ifndef UTIL_H
#define UTIL_H

#include <vector>
#include <napi.h>
#include "compiler.h"
#include <regex>
#include <string>

using namespace std;

template<typename T, typename K, typename C>
T find_in_vector(vector<K>& v, C l);

template<typename T, typename K>
Napi::Array vec_to_napi_array(Napi::Env env, vector<T> vec, K lm);
Napi::Array sort_array(CInfo info);

Napi::Object function_to_napi_object(Napi::Env env, FunctionData func);
void overloads_to_napi_array(Napi::Env env, Napi::Array& ref, FunctionData func);
string generate_string(size_t s);

string get_string(Napi::Value val);

Result resolve_napi_functions_array(Napi::Env env, Napi::Array& arr, vector<RawFunctionData>& dst);

vector<MatchedFunctionData> match_functions(vector<RawFunctionData>& fns, regex reg, string code);
void join(vector<string>& vec, string delimiter, string& location);
void napi_array_to_vec(Napi::Array arr, vector<string>& ptr);
vector<FunctionData> filter_overloads_for(FunctionData& ref, string& code);

#endif