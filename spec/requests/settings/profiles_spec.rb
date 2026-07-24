# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings::Profiles", type: :request do
  fixtures :users

  let(:user) { users(:one) }

  def image_upload(content_type: "image/png")
    Rack::Test::UploadedFile.new(file_fixture("avatar.png"), content_type)
  end

  before { sign_in user }

  describe "GET /settings/profile" do
    it "renders the profile settings page" do
      get settings_profile_path
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /settings/profile" do
    it "updates the name" do
      patch settings_profile_path, params: { name: "Updated Name" }

      expect(response).to redirect_to(settings_profile_path)
      expect(flash[:notice]).to eq("Your profile has been updated")
      expect(user.reload.name).to eq("Updated Name")
    end

    it "returns inertia errors for a blank name" do
      patch settings_profile_path, params: { name: "" }

      expect(session[:inertia_errors]).to eq(name: [ "can't be blank" ])
      expect(user.reload.name).to eq("Test User")
    end

    it "attaches the avatar" do
      patch settings_profile_path, params: { name: user.name, avatar: image_upload }

      expect(response).to redirect_to(settings_profile_path)
      expect(user.reload.avatar).to be_attached
      expect(user.avatar.filename.to_s).to eq("avatar.png")
    end

    it "replaces an already attached avatar" do
      user.avatar.attach(io: file_fixture("avatar.png").open, filename: "old.png", content_type: "image/png")

      expect {
        patch settings_profile_path, params: { name: user.name, avatar: image_upload }
      }.to change { user.reload.avatar.filename.to_s }.from("old.png").to("avatar.png")
    end

    it "rejects a file that is not an image" do
      patch settings_profile_path, params: {
        name: user.name,
        avatar: Rack::Test::UploadedFile.new(file_fixture("not-an-image.txt"), "text/plain")
      }

      expect(session[:inertia_errors]).to eq(avatar: [ "must be a PNG, JPEG, or WebP image" ])
      expect(user.reload.avatar).not_to be_attached
    end

    it "rejects an image format outside the allowed list" do
      patch settings_profile_path, params: {
        name: user.name,
        avatar: Rack::Test::UploadedFile.new(file_fixture("animation.gif"), "image/gif")
      }

      expect(session[:inertia_errors]).to eq(avatar: [ "must be a PNG, JPEG, or WebP image" ])
      expect(user.reload.avatar).not_to be_attached
    end

    # Active Storage identifies the type from the file itself, so the content
    # type a client declares can neither smuggle a file in nor keep a valid one out.
    it "trusts the identified content type over the one the client declares" do
      patch settings_profile_path, params: {
        name: user.name,
        avatar: Rack::Test::UploadedFile.new(file_fixture("avatar.png"), "application/pdf")
      }

      expect(user.reload.avatar).to be_attached
      expect(user.avatar.content_type).to eq("image/png")
    end

    # Documents the known limitation spelled out on User.avatar_is_a_supported_image:
    # Marcel keeps the declared type when the bytes carry no signature, so this
    # upload slips through. Change this example, not just the model, if we ever
    # add byte-level identification.
    it "accepts a signature-less file declared as an image (known limitation)" do
      patch settings_profile_path, params: {
        name: user.name,
        avatar: Rack::Test::UploadedFile.new(file_fixture("not-an-image.txt"), "image/png")
      }

      expect(user.reload.avatar).to be_attached
    end

    it "rejects an image larger than the size limit" do
      oversized = Tempfile.new([ "oversized", ".png" ], binmode: true)
      oversized.write("0" * (User::AVATAR_MAX_BYTE_SIZE + 1))
      oversized.rewind

      patch settings_profile_path, params: {
        name: user.name,
        avatar: Rack::Test::UploadedFile.new(oversized.path, "image/png")
      }

      expect(session[:inertia_errors]).to eq(avatar: [ "must be smaller than 5 MB" ])
      expect(user.reload.avatar).not_to be_attached
    ensure
      oversized&.close!
    end

    it "removes the avatar when asked to" do
      user.avatar.attach(io: file_fixture("avatar.png").open, filename: "avatar.png", content_type: "image/png")

      patch settings_profile_path, params: { name: user.name, remove_avatar: "1" }

      expect(response).to redirect_to(settings_profile_path)
      expect(user.reload.avatar).not_to be_attached
    end

    it "keeps the avatar when a new upload accompanies the removal flag" do
      user.avatar.attach(io: file_fixture("avatar.png").open, filename: "old.png", content_type: "image/png")

      patch settings_profile_path, params: { name: user.name, avatar: image_upload, remove_avatar: "1" }

      expect(user.reload.avatar).to be_attached
      expect(user.avatar.filename.to_s).to eq("avatar.png")
    end

    it "keeps the avatar when the record fails to save" do
      user.avatar.attach(io: file_fixture("avatar.png").open, filename: "avatar.png", content_type: "image/png")

      patch settings_profile_path, params: { name: "", remove_avatar: "1" }

      expect(user.reload.avatar).to be_attached
    end

    it "requires an authenticated user" do
      sign_out
      patch settings_profile_path, params: { name: "Updated Name" }

      expect(response).to redirect_to(sign_in_path)
      expect(user.reload.name).to eq("Test User")
    end
  end
end
