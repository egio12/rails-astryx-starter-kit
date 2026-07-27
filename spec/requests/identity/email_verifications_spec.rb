# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Identity::EmailVerifications", type: :request do
  fixtures :users

  describe "GET /identity/email_verification" do
    context "with valid token" do
      it "verifies the email" do
        user = users(:one)
        user.update!(verified: false)
        sid = user.generate_token_for(:email_verification)

        get identity_email_verification_path(sid: sid)
        expect(response).to redirect_to(root_path)
        expect(user.reload).to be_verified
      end
    end

    context "with expired token" do
      it "does not verify the email" do
        user = users(:one)
        user.update!(verified: false)
        sid = user.generate_token_for(:email_verification)

        travel 3.days

        get identity_email_verification_path(sid: sid)
        expect(response).to redirect_to(settings_email_path)
        expect(flash[:alert]).to eq("That email verification link is invalid")
        expect(user.reload).not_to be_verified
      end
    end

    context "with invalid token" do
      it "redirects to settings email" do
        get identity_email_verification_path(sid: "invalid")
        expect(response).to redirect_to(settings_email_path)
      end
    end

    context "with an unexpected lookup error" do
      it "does not suppress the error" do
        allow(User).to receive(:find_by_token_for).and_raise("database unavailable")

        expect {
          get identity_email_verification_path(sid: "valid-looking-token")
        }.to raise_error(RuntimeError, "database unavailable")
      end
    end
  end

  describe "POST /identity/email_verification" do
    it "resends the verification email" do
      user = users(:one)
      user.update!(verified: false)
      sign_in user

      expect {
        post identity_email_verification_path
      }.to have_enqueued_email(UserMailer, :email_verification).with(params: { user: user }, args: [])
      expect(response).to be_redirect
    end

    it "blocks the 4th resend within 10 minutes" do
      user = users(:one)
      user.update!(verified: false)
      sign_in user

      3.times { post identity_email_verification_path }
      post identity_email_verification_path

      expect(response).to be_redirect
      expect(flash[:alert]).to eq("Too many verification emails. Please try again later")
    end
  end
end
