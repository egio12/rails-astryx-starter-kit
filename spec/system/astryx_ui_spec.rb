# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Astryx UI", type: :system do
  fixtures :users

  it "renders the authenticated Astryx application frame" do
    visit sign_in_path
    fill_in "Email address", with: users(:one).email
    fill_in "Password", with: "Secret1*3*5*"
    click_on "Log in"

    expect(page).to have_css(".astryx-app-shell")
    expect(page).to have_css(".astryx-side-nav")
    expect(page).to have_css('[role="main"]')
    expect(page).to have_text("Dashboard")
  end

  it "renders public and authentication routes with Astryx controls" do
    visit root_path
    expect(page).to have_css(".astryx-link")

    visit sign_in_path
    expect(page).to have_css(".astryx-text-input", count: 2)
    expect(page).to have_css(".astryx-button")

    button_padding = page.evaluate_script(
      "getComputedStyle(document.querySelector('.astryx-button')).paddingInline"
    )
    expect(button_padding).not_to eq("0px")
  end
end
