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
  end
end

defmodule Mix.Tasks.CopyWasm do
  use Mix.Task

  def run(_) do
    File.rm_rf("./priv/static/wasm/")
    File.mkdir_p!("./priv/static/wasm/")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm.d.ts", "./priv/static/wasm/wasm_bg.wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm", "./priv/static/wasm/wasm_bg.wasm")
  end
end
