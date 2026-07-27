# frozen_string_literal: true

require "rails_helper"
require "tmpdir"
require_relative "../../../lib/starter_kit/renamer"

RSpec.describe StarterKit::Renamer do
  def write_fixture(root, relative_path, content)
    path = root.join(relative_path)
    path.dirname.mkpath
    path.write(content)
  end

  def build_starter_fixture(root)
    write_fixture(root, "config/application.rb", "module ReactStarterKit\nend\n")
    write_fixture(root, "package.json", %({"name":"rails-astryx-starter-kit"}\n))
    write_fixture(root, "package-lock.json", %({"name":"rails-astryx-starter-kit"}\n))
    write_fixture(
      root,
      "config/deploy.yml",
      "service: react_starter_kit\nimage: react_starter_kit\nvolume: react_starter_kit_storage\ncache: react-starter-kit-build-cache\n"
    )
    write_fixture(root, "Dockerfile", "# docker build -t react-starter-kit .\n")
    write_fixture(
      root,
      "app/views/layouts/application.html.erb",
      "<title><%= content_for(:title) || \"Rails Astryx Starter Kit\" %></title>\n" \
        "<meta name=\"application-name\" content=\"Rails Astryx Starter Kit\">\n"
    )
    write_fixture(root, "app/javascript/entrypoints/inertia.tsx", '"Rails Astryx Starter Kit"' + "\n")
    write_fixture(root, "app/javascript/components/app-sidebar.tsx", '"Rails Astryx Starter Kit"' + "\n")
    write_fixture(root, "app/javascript/components/app-logo.tsx", '"Rails Astryx Starter Kit"' + "\n")
    write_fixture(
      root,
      "app/views/pwa/manifest.json.erb",
      %({"name":"ReactStarterKit","description":"ReactStarterKit."}\n)
    )
    write_fixture(root, "README.md", "# Rails + Inertia + React + Astryx Starter Kit\n")
  end

  around do |example|
    Dir.mktmpdir do |directory|
      @root = Pathname(directory)
      build_starter_fixture(@root)
      example.run
    end
  end

  it "renames every starter identity from the product name" do
    changed_files = described_class.new(root: @root, product_name: "Acme CRM").call

    expect(changed_files).to contain_exactly(
      "Dockerfile",
      "README.md",
      "app/javascript/components/app-logo.tsx",
      "app/javascript/components/app-sidebar.tsx",
      "app/javascript/entrypoints/inertia.tsx",
      "app/views/layouts/application.html.erb",
      "app/views/pwa/manifest.json.erb",
      "config/application.rb",
      "config/deploy.yml",
      "package-lock.json",
      "package.json"
    )
    expect(@root.join("config/application.rb").read).to include("module AcmeCrm")
    expect(@root.join("package.json").read).to include('"name":"acme-crm"')
    expect(@root.join("config/deploy.yml").read).to include("service: acme_crm")
    expect(@root.join("app/views/layouts/application.html.erb").read).to include("Acme CRM")
    expect(@root.join("app/views/pwa/manifest.json.erb").read).to include('"name":"Acme CRM"')
  end

  it "uses an explicit slug for package and deployment identifiers" do
    described_class.new(root: @root, product_name: "Acme CRM", slug: "acme-platform").call

    expect(@root.join("package.json").read).to include('"name":"acme-platform"')
    expect(@root.join("config/deploy.yml").read).to include("service: acme_platform")
    expect(@root.join("config/deploy.yml").read).to include("acme-platform-build-cache")
  end

  it "transliterates the product name when deriving identifiers" do
    described_class.new(root: @root, product_name: "Caffè Felice").call

    expect(@root.join("config/application.rb").read).to include("module CaffeFelice")
    expect(@root.join("package.json").read).to include('"name":"caffe-felice"')
  end

  it "rejects a blank product name" do
    expect {
      described_class.new(root: @root, product_name: "  ")
    }.to raise_error(ArgumentError, "Product name cannot be blank")
  end

  it "rejects an invalid explicit slug" do
    expect {
      described_class.new(root: @root, product_name: "Acme CRM", slug: "Acme_CRM")
    }.to raise_error(ArgumentError, "Slug must contain lowercase letters, numbers, and single hyphens")
  end

  it "refuses a second run" do
    described_class.new(root: @root, product_name: "Acme CRM").call

    expect {
      described_class.new(root: @root, product_name: "Another Name").call
    }.to raise_error(StarterKit::Renamer::AlreadyRenamedError)
  end

  it "does not write any file when a required marker is missing" do
    original_application = @root.join("config/application.rb").read
    @root.join("package.json").write(%({"name":"custom-name"}\n))

    expect {
      described_class.new(root: @root, product_name: "Acme CRM").call
    }.to raise_error(StarterKit::Renamer::UnexpectedSourceError)

    expect(@root.join("config/application.rb").read).to eq(original_application)
  end
end
