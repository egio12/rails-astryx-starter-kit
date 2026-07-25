module ApplicationHelper
  def appearance_mode
    Appearance.explicit_mode(request.cookies["appearance"])
  end
end
