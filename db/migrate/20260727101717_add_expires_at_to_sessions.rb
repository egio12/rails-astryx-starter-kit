# frozen_string_literal: true

class AddExpiresAtToSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :sessions, :expires_at, :datetime

    reversible do |direction|
      direction.up do
        session_class = Class.new(ActiveRecord::Base) { self.table_name = "sessions" }
        session_class.update_all(expires_at: 30.days.from_now)
      end
    end

    change_column_null :sessions, :expires_at, false
    add_index :sessions, :expires_at
  end
end
