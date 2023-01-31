SHELL = /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := build
.DELETE_ON_ERROR:
.SUFFIXES:

build: clean pkg

pkg: src
	wasm-pack build ./ --target web
	sed -i ".bak" -e 's/"name": "antv-layout-wasm"/"name": "@antv\/layout-wasm"/g' pkg/package.json
	rm pkg/package.json.bak

clean:
	rm -f -r pkg