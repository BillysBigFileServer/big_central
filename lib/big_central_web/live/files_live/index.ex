defmodule BigCentralWeb.FilesLive.Index do
  use BigCentralWeb, :live_view

  alias BigCentral.Token

  # A lot of the functionality for this page needs to be written in typescript, in order to encrypt + decrypt the file metadatas without sending them to the server
  @impl true
  def mount(_params, session, socket) do
    token = session["token"]
    email = session["email"]

    socket =
      with {:ok, token} <- Token.verify(token, %{email: email}) do
        socket
        |> assign(token: token.token)
        |> assign(email: email)
        |> push_event("show-files", %{})
      else
        {:error, :nil_email} ->
          socket |> put_flash(:error, "Invalid email") |> redirect(to: ~p"/users/logout")

        {:error, error} ->
          socket |> put_flash(:error, error)
      end

    {:ok, socket}
  end
end
