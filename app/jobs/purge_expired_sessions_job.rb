# frozen_string_literal: true

class PurgeExpiredSessionsJob < ApplicationJob
  queue_as :default

  def perform
    Session.expired.in_batches.delete_all
  end
end
