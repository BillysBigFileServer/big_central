#!/bin/sh
protoc --plugin=./node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=./js -I ../wasm/bfsp/ --ts_proto_opt=env=browser --ts_proto_opt=esModuleInterop=true ../wasm/bfsp/src/bfsp.cli.proto ../wasm/bfsp/src/bfsp.proto
