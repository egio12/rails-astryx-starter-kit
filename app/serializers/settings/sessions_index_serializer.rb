# frozen_string_literal: true

module Settings
  class SessionsIndexSerializer < ApplicationSerializer
    has_many :sessions, with_traits: :details
    has_one :pagy, serializer: PagySerializer

    attributes :sort_key, :sort_direction

    typelize sort_key: :string, sort_direction: [ "asc", "desc" ]
  end
end
