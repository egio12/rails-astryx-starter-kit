# frozen_string_literal: true

module AuthenticationHelpers
  def self.signed_cookie(name, value)
    cookie_jar = ActionDispatch::Request.new(Rails.application.env_config.deep_dup).cookie_jar
    cookie_jar.signed[name] = value
    cookie_jar[name]
  end

  module Request
    def sign_in(user)
      session = user.sessions.create!
      cookies[:session_token] = AuthenticationHelpers.signed_cookie(:session_token, session.id)
    end

    def sign_out
      cookies[:session_token] = ""
    end
  end

  module System
    PASSWORD = "Secret1*3*5*"

    def sign_in(user)
      session = user.sessions.create!
      page.driver.set_cookie("session_token", AuthenticationHelpers.signed_cookie(:session_token, session.id))
    end

    # Signs in through the real form. Safari occasionally moves focus late after
    # `fill_in`, sending the password into the email field, so each value is
    # confirmed before moving on.
    def sign_in_through_form(user, password: PASSWORD)
      visit sign_in_path

      fill_in "Email address", with: user.email
      expect(page).to have_field("Email address", with: user.email)

      fill_in "Password", with: password
      expect(page).to have_field("Password", with: password)

      click_on "Log in"
      expect(page).to have_current_path(dashboard_path)
    end

    def sign_out
      page.driver.set_cookie("session_token", "")
    end
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers::Request, type: :request
  config.include AuthenticationHelpers::System, type: :system
end
