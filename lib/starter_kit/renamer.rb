# frozen_string_literal: true

require "cgi"
require "json"
require "pathname"

module StarterKit
  class Renamer
    class AlreadyRenamedError < StandardError; end
    class UnexpectedSourceError < StandardError; end

    SOURCE_NAMESPACE = "ReactStarterKit"
    SOURCE_PACKAGE_NAME = "rails-astryx-starter-kit"
    SOURCE_SERVICE_NAME = "react_starter_kit"
    SOURCE_IMAGE_NAME = "react-starter-kit"
    SOURCE_PRODUCT_NAME = "Rails Astryx Starter Kit"
    SOURCE_README_TITLE = "Rails + Inertia + React + Astryx Starter Kit"
    SLUG_PATTERN = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/

    attr_reader :namespace, :product_name, :root, :service_name, :slug

    def initialize(root:, product_name:, slug: nil)
      @root = Pathname(root)
      @product_name = product_name.to_s.strip
      raise ArgumentError, "Product name cannot be blank" if @product_name.empty?

      ascii_name = @product_name.unicode_normalize(:nfkd)
                                  .encode(Encoding::ASCII, invalid: :replace, undef: :replace, replace: "")
      @slug = slug || ascii_name.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
      unless @slug.match?(SLUG_PATTERN)
        raise ArgumentError, "Slug must contain lowercase letters, numbers, and single hyphens"
      end

      @namespace = ascii_name.scan(/[A-Za-z0-9]+/).map(&:capitalize).join
      unless @namespace.match?(/\A[A-Z][A-Za-z0-9]*\z/)
        raise ArgumentError, "Product name must produce a valid Ruby namespace"
      end

      @service_name = @slug.tr("-", "_")
    end

    def call
      ensure_not_renamed!
      edits = planned_edits
      edits.each { |path, content| path.write(content) }
      edits.map { |path, _content| path.relative_path_from(root).to_s }.sort
    end

    private

    def ensure_not_renamed!
      application_config = root.join("config/application.rb")
      return if application_config.file? && application_config.read.include?(SOURCE_NAMESPACE)

      raise AlreadyRenamedError, "This repository no longer contains the starter namespace"
    end

    def planned_edits
      replacement_plan.map do |relative_path, replacements|
        path = root.join(relative_path)
        raise UnexpectedSourceError, "Missing starter file: #{relative_path}" unless path.file?

        content = path.read
        updated = replacements.reduce(content) do |body, (source, replacement)|
          unless body.include?(source)
            raise UnexpectedSourceError, "Missing starter marker #{source.inspect} in #{relative_path}"
          end

          body.gsub(source, replacement)
        end

        [ path, updated ]
      end
    end

    def replacement_plan
      {
        "config/application.rb" => [
          [ SOURCE_NAMESPACE, namespace ]
        ],
        "package.json" => [
          [ SOURCE_PACKAGE_NAME, slug ]
        ],
        "package-lock.json" => [
          [ SOURCE_PACKAGE_NAME, slug ]
        ],
        "config/deploy.yml" => [
          [ SOURCE_SERVICE_NAME, service_name ],
          [ SOURCE_IMAGE_NAME, slug ]
        ],
        "Dockerfile" => [
          [ SOURCE_IMAGE_NAME, slug ]
        ],
        "app/views/layouts/application.html.erb" => [
          [ %(content="#{SOURCE_PRODUCT_NAME}"), %(content="#{CGI.escapeHTML(product_name)}") ],
          [ JSON.generate(SOURCE_PRODUCT_NAME), JSON.generate(product_name) ]
        ],
        "app/javascript/entrypoints/inertia.tsx" => [
          [ JSON.generate(SOURCE_PRODUCT_NAME), JSON.generate(product_name) ]
        ],
        "app/javascript/components/app-sidebar.tsx" => [
          [ JSON.generate(SOURCE_PRODUCT_NAME), JSON.generate(product_name) ]
        ],
        "app/javascript/components/app-logo.tsx" => [
          [ JSON.generate(SOURCE_PRODUCT_NAME), JSON.generate(product_name) ]
        ],
        "app/views/pwa/manifest.json.erb" => [
          [ JSON.generate("#{SOURCE_NAMESPACE}."), JSON.generate("#{product_name}.") ],
          [ JSON.generate(SOURCE_NAMESPACE), JSON.generate(product_name) ]
        ],
        "README.md" => [
          [ "# #{SOURCE_README_TITLE}", "# #{product_name}" ]
        ]
      }
    end
  end
end
