defmodule BigCentralWeb.FilesLive.Index do
  use BigCentralWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    token = session["token"]
    email = session["email"]

    # thanks to UserSessionController.require_authenticated_user/2, we can be sure that the token is valid
    {:ok,
     socket
     |> assign(token: token.token)
     |> assign(email: email)
     |> push_event("show-files", %{})}
  end
end
