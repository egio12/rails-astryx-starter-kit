# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings::Sessions", type: :request do
  fixtures :users

  before { sign_in users(:one) }

  describe "GET /settings/sessions" do
    it "renders the sessions index" do
      get settings_sessions_path
      expect(response).to have_http_status(:success)
    end

    it "serializes every session with the details trait" do
      get settings_sessions_path

      expect(inertia).to render_component "settings/sessions/index"
      expect(inertia.props[:sessions].size).to eq(users(:one).sessions.count)
      expect(inertia.props[:sessions].first.keys)
        .to match_array(%w[id user_agent ip_address created_at])
    end

    it "shares the authenticated user through the shared props serializer" do
      get settings_sessions_path

      expect(inertia.props[:auth][:user].keys)
        .to match_array(%w[id name email verified created_at updated_at])
      expect(inertia.props[:auth][:user][:email]).to eq(users(:one).email)
      expect(inertia.props[:auth][:session].keys).to eq(%w[id])
    end
  end
end
