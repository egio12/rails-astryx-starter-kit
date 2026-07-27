# frozen_string_literal: true

class Identity::PasswordResetsController < InertiaController
  RATE_LIMIT_ALERT = "Too many password reset requests. Please try again later"
  RESET_NOTICE = "If that email can receive a password reset, instructions are on the way"

  skip_before_action :authenticate

  before_action :set_user, only: %i[edit update]

  rate_limit to: 10, within: 10.minutes, name: "password-reset-ip",
             with: :rate_limit_exceeded, only: :create

  rate_limit to: 3, within: 10.minutes, name: "password-reset-email",
             by: -> { params[:email].to_s.downcase.strip },
             with: :rate_limit_exceeded, only: :create

  def new
  end

  def edit
    @email = @user.email
    @sid = params[:sid]
  end

  def create
    if @user = User.find_by(email: params[:email], verified: true)
      send_password_reset_email
    end

    redirect_to sign_in_path, notice: RESET_NOTICE
  end

  def update
    if @user.update(user_params)
      redirect_to sign_in_path, notice: "Your password was reset successfully. Please sign in"
    else
      redirect_to edit_identity_password_reset_path(sid: params[:sid]), inertia: { errors: @user.errors }
    end
  end

  private

  def set_user
    @user = User.find_by_token_for(:password_reset, params[:sid])
    return if @user

    redirect_to new_identity_password_reset_path, alert: "That password reset link is invalid"
  end

  def user_params
    params.permit(:password, :password_confirmation)
  end

  def send_password_reset_email
    UserMailer.with(user: @user).password_reset.deliver_later
  end

  def rate_limit_exceeded
    redirect_to new_identity_password_reset_path, alert: RATE_LIMIT_ALERT
  end
end
