# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Astryx UI", type: :system do
  fixtures :users

  def sign_in_as(user)
    visit sign_in_path
    fill_in "Email address", with: user.email
    fill_in "Password", with: "Secret1*3*5*"
    click_on "Log in"
    expect(page).to have_current_path(dashboard_path)
  end

  it "renders the authenticated side-nav-only application frame" do
    sign_in_as users(:one)
    page.execute_script("localStorage.removeItem('sidebar')")
    visit dashboard_path

    expect(page).to have_css(".astryx-app-shell")
    expect(page).to have_css(".astryx-side-nav")
    expect(page).to have_no_css(".astryx-top-nav")
    expect(page).to have_css('[role="main"]')
    expect(page).to have_css(".astryx-breadcrumbs")
    expect(page).to have_css(".astryx-layout-header")
    expect(page).to have_no_css('[role="toolbar"]')

    within(".astryx-side-nav") do
      expect(page).to have_button(users(:one).name, enable_aria_label: true)
      click_on "Collapse sidebar", enable_aria_label: true
      expect(page).to have_button("Expand sidebar", enable_aria_label: true)
      expect(page).to have_button(users(:one).name, enable_aria_label: true)
    end

    expect(
      page.evaluate_script("localStorage.getItem('sidebar')"),
    ).to eq("false")
  end

  it "uses the shared side navigation in Astryx's mobile drawer" do
    sign_in_as users(:one)
    page.current_window.resize_to(767, 900)
    visit settings_profile_path

    click_on "Open navigation", enable_aria_label: true

    expect(page).to have_css(".astryx-mobile-nav")
    expect(page).to have_link("Dashboard", href: dashboard_path)
    expect(page).to have_button(users(:one).name, enable_aria_label: true)

    click_link "Dashboard", href: dashboard_path

    expect(page).to have_current_path(dashboard_path)
  ensure
    page.current_window.resize_to(1400, 900)
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

  it "switches and persists all three Astryx appearance modes" do
    sign_in_as users(:one)
    visit settings_appearance_path

    expect(page).to have_css("h1", text: "Appearance settings")
    expect(page).to have_css(".astryx-segmented-control")

    click_on "Dark"
    expect(page.evaluate_script("localStorage.getItem('appearance')")).to eq("dark")
    expect(
      page.evaluate_script("document.documentElement.style.colorScheme"),
    ).to eq("dark")

    click_on "Light"
    expect(page.evaluate_script("localStorage.getItem('appearance')")).to eq("light")

    click_on "System"
    expect(page.evaluate_script("localStorage.getItem('appearance')")).to be_nil
  end

  it "navigates when the settings list row chrome is clicked" do
    sign_in_as users(:one)
    visit settings_appearance_path

    email_row = find("li", text: "Email", exact_text: true)
    expect(email_row).to have_link("Email", href: settings_email_path)

    page.execute_script("arguments[0].click()", email_row)

    expect(page).to have_current_path(settings_email_path)
  end

  it "returns from mobile settings navigation to the selected detail" do
    sign_in_as users(:one)
    page.current_window.resize_to(767, 900)
    visit settings_appearance_path

    click_on "All settings"
    expect(page).to have_text("Account settings")

    find_link("Profile", href: settings_profile_path).click

    expect(page).to have_current_path(settings_profile_path)
    expect(page).to have_button("All settings")
    expect(page).to have_no_text("Account settings")
  ensure
    page.current_window.resize_to(1400, 900)
  end

  it "renders settings forms and destructive confirmation with Astryx" do
    sign_in_as users(:one)

    visit settings_profile_path
    expect(page).to have_css(".astryx-text-input", minimum: 1)
    click_on "Delete account"
    expect(page).to have_css(".astryx-dialog")
    expect(page).to have_text("Delete account?")
    expect(page).to have_field("Password")

    visit settings_email_path
    expect(page).to have_css(".astryx-text-input")

    visit settings_password_path
    expect(page).to have_css(".astryx-text-input", minimum: 3)
  end

  it "renders dashboard widgets and session management rows" do
    other_session = users(:one).sessions.create!
    other_session.update!(user_agent: "Other browser", ip_address: "203.0.113.7")

    sign_in_as users(:one)

    visit dashboard_path

    within('[role="main"]') do
      expect(page).to have_css("h1", text: "Dashboard")
      expect(page).to have_css("h3", text: "Workspace overview")
      expect(page).to have_css("h3", text: "Recent activity")
      expect(page).to have_css("h3", text: "Next steps")
      expect(page).to have_css("h2", text: "Primary content")

      dashboard_heading_x = find("h1", text: "Dashboard").rect.x
      starter_widgets_heading_x = find("h2", text: "Starter widgets").rect.x
      expect(dashboard_heading_x).to be_within(1).of(starter_widgets_heading_x)

      primary_content_heading_x = find("h2", text: "Primary content").rect.x
      expect(dashboard_heading_x).to be_within(1).of(primary_content_heading_x)
    end

    visit settings_sessions_path

    within('[role="main"]') do
      expect(page).to have_css("table")
      expect(page).to have_css("th", text: "Device")
      expect(page).to have_css("th", text: "IP address")
      expect(page).to have_css("th", text: "Active since")
      expect(page).to have_css('[aria-label="Current session"]')
      expect(page).to have_text("Current")
      expect(page).to have_text("Other browser")
      expect(page).to have_text("203.0.113.7")
      expect(page).to have_button("Log out", count: 1)

      click_on "Log out"

      expect(page).to have_no_text("Other browser")
      expect(page).to have_css('[aria-label="Current session"]')
      expect(page).to have_text("Current")
    end
  end
end
