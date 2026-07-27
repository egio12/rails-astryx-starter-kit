# frozen_string_literal: true

class UsersController < InertiaController
  RATE_LIMIT_ALERT = "Too many sign up attempts. Please try again later"

  skip_before_action :authenticate, only: %i[new create]
  before_action :require_no_authentication, only: %i[new create]

  rate_limit to: 5, within: 1.hour, name: "sign-up-ip",
             with: :rate_limit_exceeded, only: :create

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)

    if @user.save
      start_new_session_for(@user)

      send_email_verification
      redirect_to dashboard_path, notice: "Welcome! You have signed up successfully"
    else
      redirect_to sign_up_path, inertia: { errors: @user.errors }
    end
  end

  def destroy
    user = Current.user
    authorize! user, to: :destroy?

    if user.authenticate(params[:password_challenge] || "")
      user.destroy!
      Current.session = nil
      redirect_to root_path, notice: "Your account has been deleted", inertia: { clear_history: true }
    else
      redirect_to settings_profile_path, inertia: { errors: { password_challenge: "Password challenge is invalid" } }
    end
  end

  private

  def user_params
    params.permit(:email, :name, :password, :password_confirmation)
  end

  def send_email_verification
    UserMailer.with(user: @user).email_verification.deliver_later
  end

  def rate_limit_exceeded
    redirect_to sign_up_path, alert: RATE_LIMIT_ALERT
  end
end
