defmodule BigCentralWeb.FilesLive.ViewFile do
  use BigCentralWeb, :live_view

  # A lot of the functionality for this page needs to be written in typescript, in order to encrypt + decrypt the file metadatas without sending them to the server
  @impl true
  def mount(_params, session, socket) do
    email = session["email"]

    token =
      case session["token"] do
        nil -> nil
        token -> token.token
      end

    # thanks to UserSessionController.require_authenticated_user/2, we can be sure that the token is valid
    {:ok,
     socket
     |> assign(email: email)
     |> assign(token: token)
     |> push_event("view-file", %{})}
  end
end
