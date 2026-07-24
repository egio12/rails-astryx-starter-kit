# frozen_string_literal: true

class User < ApplicationRecord
  AVATAR_CONTENT_TYPES = %w[ image/png image/jpeg image/webp ].freeze
  AVATAR_MAX_BYTE_SIZE = 5.megabytes

  has_secure_password

  # 256px covers the largest avatar we render (128px) on retina displays, and
  # WebP keeps it a few kilobytes. Variants are processed on first request.
  has_one_attached :avatar do |attachable|
    attachable.variant :square, resize_to_fill: [ 256, 256 ], format: :webp
  end

  generates_token_for :email_verification, expires_in: 2.days do
    email
  end

  generates_token_for :password_reset, expires_in: 20.minutes do
    password_salt.last(10)
  end

  has_many :sessions, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, allow_nil: true, length: { minimum: 12 }

  # Active Storage ships no attachment validators, so the format and size limits
  # advertised by the upload field are enforced here.
  #
  # KNOWN LIMITATION: this trusts `content_type`, which Active Storage derives
  # via Marcel. Marcel falls back to the type the client declared whenever the
  # leading bytes are inconclusive, so a file with no recognisable signature
  # sent as image/png is stored as image/png and passes. Closing this needs
  # byte-level identification (the active_storage_validations gem offers it as
  # `spoofing_protection`); we deliberately accept the risk for now, since the
  # worst case is a broken avatar rather than a file served as something it is not.
  validate :avatar_is_a_supported_image

  normalizes :email, with: -> { _1.strip.downcase }

  before_validation if: :email_changed?, on: :update do
    self.verified = false
  end

  after_update if: :password_digest_previously_changed? do
    sessions.where.not(id: Current.session).delete_all
  end

  private

  def avatar_is_a_supported_image
    return unless avatar.attached?

    unless avatar.content_type.in?(AVATAR_CONTENT_TYPES)
      errors.add(:avatar, "must be a PNG, JPEG, or WebP image")
    end

    if avatar.byte_size > AVATAR_MAX_BYTE_SIZE
      errors.add(:avatar, "must be smaller than #{AVATAR_MAX_BYTE_SIZE / 1.megabyte} MB")
    end
  end
end
