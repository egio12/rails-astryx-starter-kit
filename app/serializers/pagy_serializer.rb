# frozen_string_literal: true

# Serializes a Pagy::Offset instance into the numbers a client-side pagination
# control needs. `previous` and `next` are nil on the first and last page.
class PagySerializer < ApplicationSerializer
  attributes :page, :pages, :count, :limit, :from, :to, :previous, :next

  typelize page: :number,
           pages: :number,
           count: :number,
           limit: :number,
           from: :number,
           to: :number,
           previous: [ :number, nullable: true ],
           next: [ :number, nullable: true ]
end
