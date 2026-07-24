# frozen_string_literal: true

require "json"
require "pathname"

RSpec.describe "Astryx frontend migration" do
  let(:root) { Pathname.new(__dir__).join("../..").expand_path }
  let(:package) { JSON.parse(root.join("package.json").read) }
  let(:css) { root.join("app/javascript/entrypoints/application.css").read }

  it "pins the Astryx runtime and development packages" do
    expect(package.dig("dependencies", "@astryxdesign/core")).to eq("^0.1.8")
    expect(package.dig("dependencies", "@astryxdesign/theme-neutral")).to eq("^0.1.8")
    expect(package.dig("devDependencies", "@astryxdesign/cli")).to eq("^0.1.8")
  end

  it "loads the Astryx styles in canonical cascade order" do
    imports = [
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/preflight.css" layer(base);',
      '@import "@astryxdesign/core/reset.css";',
      '@import "@astryxdesign/core/astryx.css";',
      '@import "@astryxdesign/theme-neutral/theme.css";',
      '@import "@astryxdesign/core/tailwind-theme.css";',
      '@import "tailwindcss/utilities.css" layer(utilities);'
    ]

    positions = imports.map { |statement| css.index(statement) }
    expect(positions).to all(be_a(Integer))
    expect(positions).to eq(positions.sort)
    expect(css).to start_with(
      "@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;"
    )
  end
end
