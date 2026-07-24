# frozen_string_literal: true

class ApplicationSerializer
  include Alba::Resource
  include ActionPolicy::Behaviour

  helper Typelizer::DSL
  helper Alba::Inertia::Resource

  include Rails.application.routes.url_helpers

  # InertiaController passes the performer through serializer params, so `can_*`
  # attributes resolve against the same policies the controllers enforce.
  authorize :user, through: :current_user

  private

  def current_user = params[:current_user]
end
