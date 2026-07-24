# frozen_string_literal: true

class Settings::SessionsController < InertiaController
  SORT_COLUMNS = %w[user_agent ip_address created_at].freeze
  DEFAULT_SORT_COLUMN = "created_at"

  def index
    @sort_key = SORT_COLUMNS.include?(params[:sort]) ? params[:sort] : DEFAULT_SORT_COLUMN
    @sort_direction = (params[:direction] == "asc") ? "asc" : "desc"

    @pagy, @sessions = pagy(:offset, Current.user.sessions.order(@sort_key => @sort_direction))
  end
end
