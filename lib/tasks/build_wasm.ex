defmodule Mix.Tasks.BuildWasm do
  use Mix.Task

  def run(_) do
    IO.puts("Building wasm...")

    {_, 0} =
      System.cmd(
        "nix",
        [
          "build",
          "--extra-experimental-features",
          "nix-command",
          "--extra-experimental-features",
          "flakes",
          ".?submodules=1"
        ],
        cd: "./wasm/"
      )

    File.rm("assets/js/wasm.js")
    File.rm("assets/js/wasm_bg.wasm")
    File.rm("assets/js/wasm_bg.wasm.d.ts")
    File.rm("assets/js/wasm.d.ts")

    File.mkdir_p("assets/js/")

    File.cp!("./wasm/result/pkg/wasm.js", "assets/js/wasm.js")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm", "assets/js/wasm_bg.wasm")
    File.cp!("./wasm/result/pkg/wasm.d.ts", "assets/js/wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm.d.ts", "assets/js/wasm_bg.wasm.d.ts")
  end
end

defmodule Mix.Tasks.BuildWasmDeps do
  use Mix.Task

  def run(_) do
  end
end
