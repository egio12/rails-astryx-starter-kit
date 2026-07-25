# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profile avatar", type: :system do
  fixtures :users

  let(:user) { users(:one) }
  let(:avatar_path) { browser_uploadable_fixture("avatar.png") }

  before { sign_in_through_form(user) }

  # The file input is the dropzone's hidden control, so Capybara has to reveal it.
  def attach_avatar
    attach_file("Photo", avatar_path, make_visible: true)
  end

  it "keeps Save inert until something actually changes" do
    visit settings_profile_path

    expect(page).to have_button("Save", disabled: true)
    expect(page).to have_no_text("Unsaved changes")

    attach_avatar

    expect(page).to have_text("Unsaved changes")
    expect(page).to have_button("Save", disabled: false)
  end

  it "uploads a photo, shows it, and removes it again" do
    visit settings_profile_path
    expect(page).to have_no_css("img[src*='/rails/active_storage/']")

    attach_avatar
    click_on "Save"

    expect(page).to have_text("Your profile has been updated")
    expect(page).to have_css("img[src*='/rails/active_storage/']")
    expect(user.reload.avatar).to be_attached

    click_on "Remove photo"
    click_on "Save"

    expect(page).to have_no_css("img[src*='/rails/active_storage/']")
    expect(user.reload.avatar).not_to be_attached
  end

  it "rebaselines the form after renaming" do
    visit settings_profile_path

    fill_in "Name", with: "Renamed User"
    click_on "Save"

    expect(page).to have_text("Your profile has been updated")
    expect(page).to have_no_text("Unsaved changes")
    expect(page).to have_field("Name", with: "Renamed User")
    expect(user.reload.name).to eq("Renamed User")
  end

  it "keeps a dirty profile in place when navigation is cancelled" do
    visit settings_profile_path
    fill_in "Name", with: "Unsaved name"

    dismiss_confirm("You have unsaved changes. Leave this page and discard them?") do
      find_link("Email", href: settings_email_path).click
    end

    expect(page).to have_current_path(settings_profile_path)
    expect(page).to have_field("Name", with: "Unsaved name")
  end

  it "allows a dirty profile to navigate after confirmation" do
    visit settings_profile_path
    fill_in "Name", with: "Unsaved name"

    accept_confirm("You have unsaved changes. Leave this page and discard them?") do
      find_link("Email", href: settings_email_path).click
    end

    expect(page).to have_current_path(settings_email_path)
  end

  it "navigates from a clean profile without confirmation" do
    visit settings_profile_path
    find_link("Email", href: settings_email_path).click

    expect(page).to have_current_path(settings_email_path)
  end

  it "saves a dirty profile without a discard confirmation" do
    visit settings_profile_path
    fill_in "Name", with: "Saved without prompting"
    click_on "Save"

    expect(page).to have_current_path(settings_profile_path)
    expect(page).to have_text("Your profile has been updated")
    expect(user.reload.name).to eq("Saved without prompting")
  end

  # The field's own accept filter stops an unsupported format before it ever
  # reaches the form, so there is nothing to submit. The server-side rejection
  # is covered in spec/requests/settings/profiles_spec.rb.
  it "refuses an unsupported format without arming the form" do
    visit settings_profile_path

    attach_file("Photo", browser_uploadable_fixture("animation.gif"), make_visible: true)

    expect(page).to have_no_text("Unsaved changes")
    expect(page).to have_button("Save", disabled: true)
    expect(user.reload.avatar).not_to be_attached
  end
end
