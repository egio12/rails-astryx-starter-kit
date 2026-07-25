# frozen_string_literal: true

# The appearance cookie is written by the client (use-appearance.tsx) and read
# back on every request so SSR and the Rails layout render the same mode the
# client will hydrate with. Anything but an explicit mode means "system".
module Appearance
  EXPLICIT_MODES = %w[light dark].freeze

  def self.explicit_mode(value)
    value if EXPLICIT_MODES.include?(value)
  end
end
