# frozen_string_literal: true

InertiaRails.configure do |config|
  config.version = RailsVite.digest
  config.encrypt_history = Rails.env.production?
  config.use_script_element_for_initial_page = true
  config.use_data_inertia_head_attribute = true
  config.always_include_errors_hash = true
  config.parent_controller = "::InertiaController"

  # Keep runtime behavior aligned with the Docker build's SSR_ENABLED argument.
  config.ssr_enabled = ActiveModel::Type::Boolean.new.cast(ENV.fetch("SSR_ENABLED", "true"))
end
