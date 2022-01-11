{
  "targets": [
    {
      "target_name": "main",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
          "lib/main.cc",
          "lib/util.cc",
          "lib/compiler.cc"
      ],
      'xcode_settings': {
        'OTHER_CFLAGS': [
          "-std=c++17",
          "-stdlib=libc++"
        ],
      },
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}