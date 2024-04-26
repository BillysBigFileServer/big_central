defmodule Mix.Tasks.BuildWasm do
  use Mix.Task

  def run(_) do
    IO.puts("Building wasm...")

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

    File.rm_rf("./priv/static/wasm/")
    File.mkdir_p!("./priv/static/wasm/")

    File.cp!("./wasm/result/pkg/wasm.d.ts", "priv/static/wasm/wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm", "priv/static/wasm/wasm_bg.wasm")

    File.rm("assets/js/wasm.d.ts")
    File.rm("assets/js/wasm.js")

    File.mkdir_p!("assets/js/")

    File.cp!("./wasm/result/pkg/wasm.d.ts", "assets/js/wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm.js", "assets/js/wasm.js")
  end
end

defmodule Mix.Tasks.BuildWasmDeps do
  use Mix.Task

  def run(_) do
  end
end
