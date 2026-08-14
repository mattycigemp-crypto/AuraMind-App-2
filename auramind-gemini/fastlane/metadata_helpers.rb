# metadata_helpers.rb — Ruby helpers used by the iOS fastlane Fastfile.
#
# Kept tiny so Fastfile stays readable. Add new helpers here when the same
# logic gets called from more than one lane.

module MetadataHelpers
  # Reserved for future per-locale copy overrides beyond en-US.
  # Currently `fastlane deliver` reads everything from
  #   fastlane/metadata/<locale>/<field>.txt
  # which is the canonical pattern fastlane expects (no custom logic needed).
end
