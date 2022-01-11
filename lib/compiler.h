#ifndef COMPILER_H
#define COMPILER_H

#include <napi.h>
#include <regex>
#include <vector>
#include <string>

using namespace Napi;
using namespace std;

struct FunctionData {
    string name;
    string id;
    vector<FunctionData> overloads;
    string inside;
    vector<string> fields;
};

struct RawFunctionData {
    bool brackets;
    bool optional;
    string name;
};

struct MatchedFunctionData {
    string name;
    size_t position;
    size_t size;
    RawFunctionData ref;
};

enum FieldReaderResult {
    Success,
    Failed
};

typedef FieldReaderResult Result;

typedef const CallbackInfo& CInfo;

template<typename A, typename T, typename K>
vector<A> iterate_vector(vector<K>& vec, T lm);

class Compiler : public ObjectWrap<Compiler> 
{
    public:
        static Object Init(Napi::Env env, Object exports);
        Compiler(CInfo info);

        Napi::Value get_matched_functions(CInfo info);
        Napi::Value get_functions(CInfo info);
        Napi::Value start(CInfo info);
        Napi::Value get_compiled_code(CInfo info);

        string code;
        vector<FunctionData> functions;

    private:
        vector<RawFunctionData> fns;
        vector<MatchedFunctionData> matches;
        string system_id();

        regex regexp;

        size_t flen;
        size_t len;
        int64_t current;
        size_t sys;

        bool is_empty(string s);
        bool is_dollar(char& c);
        bool is_escape_char(char& c);
        bool is_closure_bracket(char& c);
        bool is_open_bracket(char& c);
        bool is_semicolon(char& c);

        bool eof();

        Compiler* seek(size_t pos);
        Compiler* skip(size_t n);

        char& letter();
        char& next();
        char& peek();

        void shift();
        MatchedFunctionData get_indexed_function();
        FunctionData read_function(Napi::Env env, MatchedFunctionData &func);
        FunctionData create_function(string name);
        MatchedFunctionData create_match_function(string name);
        FieldReaderResult read_function_fields(Napi::Env env, FunctionData& ref);

        bool is_array_sorted();
};

#endif