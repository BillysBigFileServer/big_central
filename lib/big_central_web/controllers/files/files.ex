defmodule BigCentralWeb.FilesController do
  use BigCentralWeb, :controller
  alias BigCentralWeb.UserLayouts

  def index(conn, _params) do
    token = get_session(conn, :token)
    email = get_session(conn, :email)
    render(conn, :index, token: token, email: email)
  end

  def view_file(conn, _params) do
    token = get_session(conn, :token)
    email = get_session(conn, :email)
    render(conn, :view_file, token: token, email: email)
  end
end
