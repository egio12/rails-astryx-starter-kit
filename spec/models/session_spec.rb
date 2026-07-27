# frozen_string_literal: true

require "rails_helper"

RSpec.describe Session, type: :model do
  fixtures :users

  describe "expiration" do
    it "expires 30 days after creation" do
      freeze_time do
        session = users(:one).sessions.create!

        expect(session.expires_at).to eq(30.days.from_now)
      end
    end

    it "preserves an explicitly supplied expiration" do
      expiration = 2.hours.from_now

      session = users(:one).sessions.create!(expires_at: expiration)

      expect(session.expires_at).to be_within(1.second).of(expiration)
    end

    it "reports whether it has expired" do
      expect(users(:one).sessions.build(expires_at: 1.second.ago)).to be_expired
      expect(users(:one).sessions.build(expires_at: 1.second.from_now)).not_to be_expired
    end
  end
end
