# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings::Sessions", type: :request do
  fixtures :users

  let(:user) { users(:one) }

  before { sign_in user }

  describe "GET /settings/sessions" do
    it "renders the sessions index" do
      get settings_sessions_path
      expect(response).to have_http_status(:success)
    end

    it "serializes every session with the details trait" do
      get settings_sessions_path

      expect(inertia).to render_component "settings/sessions/index"
      expect(inertia.props[:sessions].size).to eq(user.sessions.count)
      expect(inertia.props[:sessions].first.keys)
        .to match_array(%w[id user_agent ip_address created_at can_destroy])
    end

    it "exposes the SessionPolicy verdict to the client" do
      get settings_sessions_path

      expect(inertia.props[:sessions]).to all(include("can_destroy" => true))
    end

    it "never serializes another user's sessions" do
      users(:two).sessions.create!

      get settings_sessions_path

      expect(inertia.props[:sessions].map { |s| s["id"] })
        .to match_array(user.sessions.pluck(:id))
    end

    it "shares the authenticated user through the shared props serializer" do
      get settings_sessions_path

      expect(inertia.props[:auth][:user].keys)
        .to match_array(%w[id name email verified created_at updated_at])
      expect(inertia.props[:auth][:user][:email]).to eq(user.email)
      expect(inertia.props[:auth][:session].keys).to eq(%w[id])
    end

    context "with more sessions than fit on one page" do
      let(:limit) { Pagy::OPTIONS[:limit] }

      before { (limit + 2).times { user.sessions.create! } }

      it "returns the first page and its pagination metadata" do
        get settings_sessions_path

        expect(inertia.props[:sessions].size).to eq(limit)
        expect(inertia.props[:pagy]).to include(
          "page" => 1,
          "count" => user.sessions.count,
          "limit" => limit,
          "next" => 2
        )
        expect(inertia.props[:pagy]["previous"]).to be_nil
      end

      it "returns the requested page" do
        get settings_sessions_path, params: { page: 2 }

        expect(inertia.props[:pagy]["page"]).to eq(2)
        expect(inertia.props[:pagy]["previous"]).to eq(1)
      end
    end

    describe "sorting" do
      it "sorts by newest session first by default" do
        get settings_sessions_path

        expect(inertia.props[:sort_key]).to eq("created_at")
        expect(inertia.props[:sort_direction]).to eq("desc")
        expect(inertia.props[:sessions].map { |s| s["created_at"] })
          .to eq(inertia.props[:sessions].map { |s| s["created_at"] }.sort.reverse)
      end

      it "honours a whitelisted sort column and direction" do
        get settings_sessions_path, params: { sort: "ip_address", direction: "asc" }

        expect(inertia.props[:sort_key]).to eq("ip_address")
        expect(inertia.props[:sort_direction]).to eq("asc")
      end

      it "falls back to the default column when the sort param is not allowed" do
        get settings_sessions_path, params: { sort: "user_id", direction: "asc" }

        expect(inertia.props[:sort_key]).to eq("created_at")
      end
    end
  end
end
