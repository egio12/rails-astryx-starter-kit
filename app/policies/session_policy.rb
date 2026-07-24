# frozen_string_literal: true

class SessionPolicy < ApplicationPolicy
  # Signing out is destroying a session, so the current session is destroyable
  # too — a user may only ever act on their own sessions.
  def destroy? = owner?

  relation_scope { |relation| relation.where(user: user) }
end
