defmodule BigCentralWeb.Router do
  use BigCentralWeb, :router

  import BigCentralWeb.UserSessionController

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {BigCentralWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  # Other scopes may use custom stacks.
  # scope "/api", BigCentralWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:big_central, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: BigCentralWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  scope "/api/v1", BigCentralWeb do
    pipe_through :api

    get "/dl_token", ApiController, :show
    get "/public_key", ApiController, :public_key
  end

  scope "/", BigCentralWeb do
    pipe_through [:browser]

    live_session :home,
      layout: {BigCentralWeb.Layouts, :home} do
      live "/", HomeLive.Index
    end
  end

  scope "/", BigCentralWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    live_session :unauthenticated,
      layout: {BigCentralWeb.UserLive.Layouts, :app} do
      live "/signup", UserLive.Signup
      live "/login", UserLive.Login
      live "/auth_app_success", UserLive.AuthAppSuccess
      live "/files/view_file", FilesLive.ViewFile
    end

    get "/users/logout", UserSessionController, :delete
    post "/users/signup", UserSessionController, :create
    post "/users/login", UserSessionController, :create
  end

  scope "/", BigCentralWeb do
    pipe_through [:browser, :require_authenticated_user]

    live_session :authenticated,
      layout: {BigCentralWeb.UserLive.Layouts, :app} do
      live "/tokens", UserLive.Tokens
      live "/files", FilesLive.Index
    end
  end
end
