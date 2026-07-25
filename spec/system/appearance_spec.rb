# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Appearance", type: :system do
  it "renders the login page fully dark when the appearance cookie is dark" do
    visit sign_in_path
    page.driver.browser.manage.add_cookie(name: "appearance", value: "dark")
    visit sign_in_path

    expect(page).to have_css("#app [data-astryx-theme]")
    color_scheme = page.evaluate_script(
      'getComputedStyle(document.querySelector("#app [data-astryx-theme]")).colorScheme',
    )
    expect(color_scheme).to eq("dark")
  end

  it "keeps the login page on system appearance without a cookie" do
    visit sign_in_path

    expect(page).to have_css("#app [data-astryx-theme]")
    color_scheme = page.evaluate_script(
      'getComputedStyle(document.querySelector("#app [data-astryx-theme]")).colorScheme',
    )
    expect(color_scheme).to eq("light dark")
  end
end
