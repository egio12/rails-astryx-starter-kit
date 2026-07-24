# frozen_string_literal: true

class SessionSerializer < ApplicationSerializer
  attributes :id

  trait :details do
    attributes :user_agent, :ip_address, :created_at

    attribute :can_destroy do |session|
      allowed_to?(:destroy?, session)
    end

    typelize can_destroy: :boolean
  end
end
