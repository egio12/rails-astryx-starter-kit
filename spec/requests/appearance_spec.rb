# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Appearance", type: :request do
  describe "GET /sign_in" do
    context "with an appearance cookie" do
      before { cookies[:appearance] = "dark" }

      it "shares the appearance with the client" do
        get sign_in_path
        expect(inertia).to have_props(appearance: "dark")
      end

      it "renders data-theme on the html element" do
        get sign_in_path
        expect(response.body).to match(/<html[^>]*\bdata-theme="dark"/)
      end
    end

    context "without an appearance cookie" do
      it "defaults to system" do
        get sign_in_path
        expect(inertia).to have_props(appearance: "system")
      end

      it "renders no data-theme attribute" do
        get sign_in_path
        expect(response.body).not_to match(/<html[^>]*\bdata-theme=/)
      end
    end

    context "with a tampered appearance cookie" do
      before { cookies[:appearance] = %(dark" onload="alert(1)) }

      it "falls back to system" do
        get sign_in_path
        expect(inertia).to have_props(appearance: "system")
        expect(response.body).not_to match(/<html[^>]*\bdata-theme=/)
      end
    end
  end
end
