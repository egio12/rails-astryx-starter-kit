# frozen_string_literal: true

RSpec.configure do |config|
  # Rate limit counters live in the Action Controller cache store, which is not reset by
  # transactional fixtures. Without this the suite becomes order-dependent.
  config.before { ActionController::Base.cache_store.clear }
end
