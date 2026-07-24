# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions", type: :request do
  fixtures :users

  describe "GET /sign_in" do
    it "renders the sign in page" do
      get sign_in_path
      expect(response).to have_http_status(:success)
    end

    it "redirects authenticated users" do
      sign_in users(:one)
      get sign_in_path
      expect(response).to redirect_to(root_path)
    end
  end

  describe "POST /sign_in" do
    context "with valid credentials" do
      it "signs in and sets a session cookie" do
        post sign_in_path, params: { email: users(:one).email, password: "Secret1*3*5*" }
        expect(response).to redirect_to(dashboard_path)
        expect(cookies[:session_token]).to be_present

        get dashboard_path
        expect(response).to have_http_status(:success)
      end
    end

    context "with invalid credentials" do
      it "redirects back with an alert" do
        post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
        expect(response).to redirect_to(sign_in_path)
        expect(flash[:alert]).to eq("That email or password is incorrect")

        get dashboard_path
        expect(response).to redirect_to(sign_in_path)
      end
    end

    context "when rate limited by IP" do
      it "blocks the 11th attempt from the same IP" do
        10.times do |i|
          post sign_in_path, params: { email: "attacker#{i}@example.com", password: "wrongpassword" }
          expect(flash[:alert]).to eq("That email or password is incorrect")
        end

        post sign_in_path, params: { email: "attacker10@example.com", password: "wrongpassword" }

        expect(response).to redirect_to(sign_in_path)
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end
    end

    context "when rate limited by email" do
      it "blocks the 6th attempt against the same email" do
        5.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
          expect(flash[:alert]).to eq("That email or password is incorrect")
        end

        post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }

        expect(response).to redirect_to(sign_in_path)
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end

      it "ignores casing and surrounding whitespace in the email" do
        5.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
        end

        post sign_in_path, params: { email: " #{users(:one).email.upcase} ", password: "wrongpassword" }

        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end
    end

    context "when the rate limit window has elapsed" do
      it "allows sign in again after 3 minutes" do
        6.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
        end
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")

        travel 4.minutes do
          post sign_in_path, params: { email: users(:one).email, password: "Secret1*3*5*" }

          expect(response).to redirect_to(dashboard_path)
          expect(cookies[:session_token]).to be_present
        end
      end
    end
  end

  describe "DELETE /sessions/:id" do
    it "destroys the session" do
      sign_in users(:one)
      session_record = users(:one).sessions.last
      delete session_path(session_record)
      expect(response).to redirect_to(settings_sessions_path)
      expect(Session.exists?(session_record.id)).to be(false)
    end
  end
end
