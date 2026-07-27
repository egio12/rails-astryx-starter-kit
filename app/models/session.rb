# frozen_string_literal: true

class Session < ApplicationRecord
  LIFETIME = 30.days

  belongs_to :user

  scope :expired, -> { where(expires_at: ..Time.current) }

  before_validation(on: :create) { self.expires_at ||= LIFETIME.from_now }

  before_create do
    self.user_agent = Current.user_agent
    self.ip_address = Current.ip_address
  end

  def expired? = expires_at <= Time.current
end
