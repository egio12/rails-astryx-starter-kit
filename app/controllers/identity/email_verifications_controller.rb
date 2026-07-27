# frozen_string_literal: true

class Identity::EmailVerificationsController < InertiaController
  RATE_LIMIT_ALERT = "Too many verification emails. Please try again later"

  skip_before_action :authenticate, only: :show

  before_action :set_user, only: :show

  rate_limit to: 3, within: 10.minutes, name: "verification-user",
             by: -> { Current.user.id },
             with: :rate_limit_exceeded, only: :create

  def show
    @user.update! verified: true
    redirect_to root_path, notice: "Thank you for verifying your email address"
  end

  def create
    send_email_verification
    redirect_back_or_to root_path, notice: "We sent a verification email to your email address"
  end

  private

  def set_user
    @user = User.find_by_token_for(:email_verification, params[:sid])
    return if @user

    redirect_to settings_email_path, alert: "That email verification link is invalid"
  end

  def send_email_verification
    UserMailer.with(user: Current.user).email_verification.deliver_later
  end

  def rate_limit_exceeded
    redirect_back_or_to root_path, alert: RATE_LIMIT_ALERT
  end
end
