# frozen_string_literal: true

require "rails_helper"

RSpec.describe SessionPolicy, type: :policy do
  fixtures :users

  let(:owner) { users(:one) }
  let(:other) { users(:two) }
  let(:session_record) { owner.sessions.create! }

  describe "#destroy?" do
    it "allows the owner" do
      expect(described_class.new(session_record, user: owner).apply(:destroy?)).to be(true)
    end

    it "denies everyone else" do
      expect(described_class.new(session_record, user: other).apply(:destroy?)).to be(false)
    end
  end

  describe "relation scope" do
    it "only returns the user's own sessions" do
      session_record
      other_session = other.sessions.create!

      scope = described_class.new(nil, user: owner)
                             .apply_scope(Session.all, type: :active_record_relation)

      expect(scope).to include(session_record)
      expect(scope).not_to include(other_session)
    end
  end
end
