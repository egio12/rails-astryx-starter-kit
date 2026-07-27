# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Identity::PasswordResets", type: :request do
  fixtures :users

  describe "GET /identity/password_reset/new" do
    it "renders the forgot password page" do
      get new_identity_password_reset_path
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /identity/password_reset" do
    context "with a verified user" do
      it "sends a password reset email" do
        expect {
          post identity_password_reset_path, params: { email: users(:one).email }
        }.to have_enqueued_email(UserMailer, :password_reset).with(params: { user: users(:one) }, args: [])
        expect(response).to redirect_to(sign_in_path)
        expect(flash[:notice]).to eq("If that email can receive a password reset, instructions are on the way")
      end
    end

    context "with an unverified user" do
      it "returns the same public response without sending email" do
        users(:one).update!(verified: false)

        expect {
          post identity_password_reset_path, params: { email: users(:one).email }
        }.not_to have_enqueued_mail(UserMailer, :password_reset)
        expect(response).to redirect_to(sign_in_path)
        expect(flash[:notice]).to eq("If that email can receive a password reset, instructions are on the way")
      end
    end

    context "with a nonexistent email" do
      it "returns the same public response without sending email" do
        expect {
          post identity_password_reset_path, params: { email: "missing@example.com" }
        }.not_to have_enqueued_mail(UserMailer, :password_reset)
        expect(response).to redirect_to(sign_in_path)
        expect(flash[:notice]).to eq("If that email can receive a password reset, instructions are on the way")
      end
    end

    context "when rate limited by IP" do
      it "blocks the 11th request within 10 minutes" do
        10.times do |index|
          post identity_password_reset_path, params: { email: "missing#{index}@example.com" }
        end

        post identity_password_reset_path, params: { email: "missing10@example.com" }

        expect(response).to redirect_to(new_identity_password_reset_path)
        expect(flash[:alert]).to eq("Too many password reset requests. Please try again later")
      end
    end

    context "when rate limited by email" do
      it "blocks the 4th normalized email request within 10 minutes" do
        3.times do
          post identity_password_reset_path, params: { email: users(:one).email }
        end

        post identity_password_reset_path, params: { email: " #{users(:one).email.upcase} " }

        expect(response).to redirect_to(new_identity_password_reset_path)
        expect(flash[:alert]).to eq("Too many password reset requests. Please try again later")
      end
    end
  end

  describe "GET /identity/password_reset/edit" do
    it "renders the reset page with valid token" do
      sid = users(:one).generate_token_for(:password_reset)
      get edit_identity_password_reset_path(sid: sid)
      expect(response).to have_http_status(:success)
    end

    it "rejects invalid reset token" do
      get edit_identity_password_reset_path(sid: "invalid")
      expect(response).to redirect_to(new_identity_password_reset_path)
    end

    it "does not suppress unexpected lookup errors" do
      allow(User).to receive(:find_by_token_for).and_raise("database unavailable")

      expect {
        get edit_identity_password_reset_path(sid: "valid-looking-token")
      }.to raise_error(RuntimeError, "database unavailable")
    end
  end

  describe "PATCH /identity/password_reset" do
    context "with valid token" do
      it "updates the password" do
        sid = users(:one).generate_token_for(:password_reset)
        patch identity_password_reset_path(sid: sid), params: {
          password: "NewPassword1*3*",
          password_confirmation: "NewPassword1*3*"
        }
        expect(response).to redirect_to(sign_in_path)
      end
    end

    context "with expired token" do
      it "rejects the password change" do
        sid = users(:one).generate_token_for(:password_reset)
        travel 30.minutes

        patch identity_password_reset_path(sid: sid), params: {
          password: "NewPassword1*3*",
          password_confirmation: "NewPassword1*3*"
        }
        expect(response).to redirect_to(new_identity_password_reset_path)
        expect(flash[:alert]).to eq("That password reset link is invalid")
      end
    end

    context "with mismatched password confirmation" do
      it "rejects the password change" do
        sid = users(:one).generate_token_for(:password_reset)
        patch identity_password_reset_path(sid: sid), params: {
          password: "NewPassword1*3*",
          password_confirmation: "different"
        }
        expect(response).to redirect_to(edit_identity_password_reset_path(sid: sid))
      end
    end
  end
end
