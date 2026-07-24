# frozen_string_literal: true

class Settings::SessionsController < InertiaController
  SORT_COLUMNS = %w[user_agent ip_address created_at].freeze
  DEFAULT_SORT_COLUMN = "created_at"

  def index
    @sort_key = SORT_COLUMNS.include?(params[:sort]) ? params[:sort] : DEFAULT_SORT_COLUMN
    @sort_direction = (params[:direction] == "asc") ? "asc" : "desc"

    sessions = authorized_scope(Session.all).order(@sort_key => @sort_direction)

    @pagy, @sessions = pagy(:offset, sessions)
  end
end
