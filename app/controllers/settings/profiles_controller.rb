# frozen_string_literal: true

class Settings::ProfilesController < InertiaController
  before_action :set_user

  def show
  end

  def update
    authorize! @user, to: :update?

    if @user.update(user_params)
      # Purged only after the record saves, so a rejected name never costs the
      # user their photo. A new upload in the same request wins over the flag.
      # Synchronous on purpose: the redirect below re-renders the page, and with
      # `purge_later` the removed photo could still be there when it does.
      @user.avatar.purge if discard_avatar?

      redirect_to settings_profile_path, notice: "Your profile has been updated"
    else
      redirect_to settings_profile_path, inertia: { errors: @user.errors }
    end
  end

  private

  def set_user
    @user = Current.user
  end

  def user_params
    params.permit(:name, :avatar)
  end

  def discard_avatar?
    params[:avatar].blank? && ActiveModel::Type::Boolean.new.cast(params[:remove_avatar])
  end
end
