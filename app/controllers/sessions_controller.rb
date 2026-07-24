# frozen_string_literal: true

class SessionsController < InertiaController
  RATE_LIMIT_ALERT = "Too many sign in attempts. Please try again in a few minutes"

  skip_before_action :authenticate, only: %i[new create]
  before_action :require_no_authentication, only: %i[new create]
  before_action :set_session, only: :destroy

  rate_limit to: 10, within: 3.minutes, name: "sign-in-ip",
             with: :rate_limit_exceeded, only: :create

  rate_limit to: 5, within: 3.minutes, name: "sign-in-email",
             by: -> { params[:email].to_s.downcase.strip },
             with: :rate_limit_exceeded, only: :create

  def new
  end

  def create
    if user = User.authenticate_by(email: params[:email], password: params[:password])
      @session = user.sessions.create!
      cookies.signed.permanent[:session_token] = { value: @session.id, httponly: true }

      redirect_to dashboard_path, notice: "Signed in successfully"
    else
      redirect_to sign_in_path, alert: "That email or password is incorrect"
    end
  end

  def destroy
    authorize! @session, to: :destroy?

    @session.destroy!
    Current.session = nil
    redirect_to settings_sessions_path, notice: "That session has been logged out", inertia: { clear_history: true }
  end

  private

  # Scoping the lookup keeps another user's session id a 404 rather than a 403,
  # while `authorize!` in the action still enforces the rule explicitly.
  def set_session
    @session = authorized_scope(Session.all).find(params[:id])
  end

  def rate_limit_exceeded
    redirect_to sign_in_path, alert: RATE_LIMIT_ALERT
  end
end
