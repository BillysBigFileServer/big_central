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
        overlays = [ rust-overlay.overlay ];
        pkgs = import nixpkgs { inherit system overlays; };
        rust = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
        inputs = with pkgs; [
          wasm-pack
          cargo-binutils
          zig
          wasm-bindgen-cli
          protobuf
          # for wasm-opt
          binaryen
          (rust-bin.stable.latest.minimal.override {
            targets = [ "wasm32-unknown-unknown" ];
          })
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
            HOME=$(mktemp -d fake-homeXXXX) CC="zig cc -target wasm32-freestanding" RUST_LOG=debug wasm-pack build --release --target web --out-dir ./pkg -m no-install --no-pack
          '';
          installPhase = ''
            mkdir -p $out
            cp -r ./pkg/ $out
          '';
        };

        devShell = pkgs.mkShell { packages = inputs; };
      });
}
