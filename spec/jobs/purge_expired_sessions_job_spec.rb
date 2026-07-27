# frozen_string_literal: true

require "rails_helper"

RSpec.describe PurgeExpiredSessionsJob, type: :job do
  fixtures :users

  it "deletes expired sessions and preserves active ones" do
    expired = users(:one).sessions.create!(expires_at: 1.day.ago)
    active = users(:one).sessions.create!(expires_at: 1.day.from_now)

    expect {
      described_class.perform_now
    }.to change(Session, :count).by(-1)

    expect(Session.exists?(expired.id)).to be(false)
    expect(Session.exists?(active.id)).to be(true)
  end
end
