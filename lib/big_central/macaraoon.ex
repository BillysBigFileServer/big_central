defmodule Macaroon do
  use Rustler, otp_app: :big_central, crate: :macaroon

  # When your NIF is loaded, it will override this function.
  def generate_macaroon(_location, _key, _identifier), do: :erlang.nif_error(:nif_not_loaded)
  def add_first_party_caveat(_macaroon, _predicate), do: :erlang.nif_error(:nif_not_loaded)
  # We need the macaroon key to verify the macaroon
  def verify_macaroon(_macaroon, _key, _caveats), do: :erlang.nif_error(:nif_not_loaded)
end
