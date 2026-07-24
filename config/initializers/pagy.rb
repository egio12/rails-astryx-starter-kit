# frozen_string_literal: true

require "pagy"

# Defaults inherited by every paginator. Pagy's own default limit is 20.
Pagy::OPTIONS[:limit] = 10
Pagy::OPTIONS.freeze
