# frozen_string_literal: true

class UserSerializer < ApplicationSerializer
  attributes :id, :name, :email, :verified, :created_at, :updated_at

  # Path rather than URL: the redirect route is same-origin, so no host config
  # is needed. The variant itself is generated on first request.
  attribute :avatar_url do |user|
    if user.avatar.attached?
      rails_representation_url(user.avatar.variant(:square), only_path: true)
    end
  end

  typelize avatar_url: [ :string, nullable: true ]
end
