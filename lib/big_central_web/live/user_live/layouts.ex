defmodule BigCentralWeb.UserLive.Layouts do
  use BigCentralWeb, :live_view

  alias Bfsp.Biscuit
  alias BigCentral.Repo
  import Ecto.Query

  def auth_header(assigns) do
    BigCentralWeb.Layouts.auth_header(assigns)
  end

  embed_templates "layouts/*"
end
