# frozen_string_literal: true

class ApplicationPolicy < ActionPolicy::Base
  # Every policy is evaluated for a signed-in user. Actions reachable without a
  # session are not authorized — they skip the policy layer entirely.
  authorize :user

  private

  def owner? = record.user_id == user.id
end
