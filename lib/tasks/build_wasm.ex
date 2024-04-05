defmodule Mix.Tasks.BuildWasm do
  use Mix.Task

  def run(_) do
    IO.puts("Building wasm...")

    System.cmd("nix", ["build"], cd: "wasm/")

    File.rm_rf!("priv/static/wasm/")
    File.mkdir_p!("priv/static/wasm/")

    File.cp!("./wasm/result/pkg/wasm.d.ts", "priv/static/wasm/wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm.js", "priv/static/wasm/wasm.js")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm", "priv/static/wasm/wasm_bg.wasm")
    File.cp!("./wasm/result/pkg/wasm_bg.wasm.d.ts", "priv/static/wasm/wasm_bg.wasm.d.ts")

    File.rm!("assets/js/wasm.d.ts")
    File.rm!("assets/js/wasm.js")

    File.cp!("./wasm/result/pkg/wasm.d.ts", "assets/js/wasm.d.ts")
    File.cp!("./wasm/result/pkg/wasm.js", "assets/js/wasm.js")
  end
end
