defmodule Macaroon do
  use Rustler, otp_app: :big_central, crate: :macaroon

  # When your NIF is loaded, it will override this function.
  def generate_macaroon(_location, _key, _identifier), do: :erlang.nif_error(:nif_not_loaded)
end
