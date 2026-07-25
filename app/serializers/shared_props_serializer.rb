# frozen_string_literal: true

class SharedPropsSerializer < ApplicationSerializer
  one :auth, source: proc { Current }

  # SSR must render the Theme wrapper with the mode the client will hydrate
  # with; React does not patch attribute mismatches during hydration.
  attribute :appearance do |controller|
    Appearance.explicit_mode(controller.request.cookies["appearance"]) || "system"
  end

  typelize appearance: [ "light", "dark", "system" ]
end
