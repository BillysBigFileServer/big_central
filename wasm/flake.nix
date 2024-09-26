{
  description = "Build ts shit";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ rust-overlay.overlays.default ];
        pkgs = import nixpkgs { inherit system overlays; };
        rust = (pkgs.rust-bin.fromRustupToolchainFile
          ./rust-toolchain.toml).override {
            targets = [ "wasm32-unknown-unknown" ];
          };
        inputs = with pkgs; [
          wasm-pack
          # i know i need this, i don't remember why
          cargo-binutils
          # easy cross compiling
          zig
          cargo-zigbuild

          wasm-bindgen-cli
          # to compile bfsp, but we shouldn't need this
          protobuf
          # for wasm-opt
          binaryen
          rust
        ];
      in {
        defaultPackage = pkgs.rustPlatform.buildRustPackage {
          pname = "ts-native";
          version = "1.0.0";
          sandbox = false;

          src = ./.;

          cargoLock = { lockFile = ./Cargo.lock; };

          nativeBuildInputs = inputs;

          buildPhase = ''
            echo 'Building wasm...'
            # We need to specify the home dir for wasm-pack to work
            export HOME=$(pwd)/$(mktemp -d fake-homeXXXX)
            mkdir -p $HOME/.cache/cargo-zigbuild/0.19.1/
            echo '#!/bin/sh exec "/nix/store/ywsqmw3ldi6n4fcx8bjab0nswczg5n56-cargo-zigbuild-0.19.1/bin/.cargo-zigbuild-wrapped" zig cc -- -g -target wasm32-freestanding "$@"' | tee $HOME/.cache/cargo-zigbuild/0.19.1/zigcc-wasm32-unknown-unknown-785d.sh
            chmod +x $HOME/.cache/cargo-zigbuild/0.19.1/zigcc-wasm32-unknown-unknown-785d.sh
            export PATH=$PATH:$HOME/.cache/cargo-zigbuild/0.19.1/
            cargo zigbuild --offline --release --target=wasm32-unknown-unknown
            wasm-bindgen target/wasm32-unknown-unknown/release/wasm.wasm --target=bundler --out-dir ./pkg
          '';
          installPhase = ''
            mkdir -p $out
            cp -r ./pkg/ $out
          '';
        };

        devShell = pkgs.mkShell { packages = inputs; };
      });
}
