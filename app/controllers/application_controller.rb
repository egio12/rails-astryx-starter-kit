# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pagy::Method

  # Authentication lives in Current, so policies read the performer from there.
  authorize :user, through: -> { Current.user }

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :set_current_request_details
  before_action :authenticate

  rescue_from ActionPolicy::Unauthorized do |error|
    redirect_to root_path, alert: error.result.message
  end

  private

  def authenticate
    redirect_to sign_in_path unless perform_authentication
  end

  def require_no_authentication
    return unless perform_authentication

    flash[:notice] = "You are already signed in"
    redirect_to root_path
  end

  def perform_authentication
    session_record = Session.find_by_id(cookies.signed[:session_token])
    return unless session_record

    if session_record.expired?
      session_record.destroy!
      cookies.delete(:session_token)
      return
    end

    Current.session ||= session_record
  end

  def start_new_session_for(user)
    session_record = user.sessions.create!
    Current.session = session_record
    cookies.signed[:session_token] = {
      value: session_record.id,
      expires: session_record.expires_at,
      httponly: true
    }
    session_record
  end

  def set_current_request_details
    Current.user_agent = request.user_agent
    Current.ip_address = request.ip
  end
end
