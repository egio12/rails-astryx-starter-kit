# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions table", type: :system do
  fixtures :users

  let(:user) { users(:one) }
  let(:limit) { Pagy::OPTIONS[:limit] }

  before do
    # Session overwrites user_agent/ip_address from Current on create, so the
    # recognisable values have to be written afterwards.
    (limit + 2).times do |index|
      user.sessions.create!.update!(
        user_agent: "Device #{format('%02d', index)}",
        ip_address: "203.0.113.#{index}"
      )
    end

    visit sign_in_path
    fill_in "Email address", with: user.email
    fill_in "Password", with: "Secret1*3*5*"
    click_on "Log in"
    expect(page).to have_current_path(dashboard_path)
  end

  it "paginates on the server and keeps the page in the URL" do
    visit settings_sessions_path

    within('[role="main"]') do
      expect(page).to have_css("tbody tr", count: limit)

      within("nav[aria-label='Table pagination']") { click_on "2" }

      expect(page).to have_css("tbody tr", count: user.sessions.count - limit)
    end

    expect(page).to have_current_path(/page=2/)
  end

  it "sorts on the server when a column header is clicked" do
    visit settings_sessions_path

    within('[role="main"]') do
      click_on "Device"

      expect(page).to have_css("tbody tr:first-child", text: "Device 00")
    end

    expect(page).to have_current_path(/sort=user_agent/)
  end
end
