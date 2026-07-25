# frozen_string_literal: true

# Attach browser uploads from the system tmpdir, never from the repository.
#
# When the repository lives under a macOS TCC-protected folder (~/Documents,
# ~/Desktop, ~/Downloads), headless Chrome may be denied read access to file
# fixtures depending on how the test process was spawned: `bin/rspec` from a
# terminal works, but the extra parent process introduced by `bin/ci` changes
# the TCC attribution and the upload dies in the browser with
# net::ERR_ACCESS_DENIED — the request never reaches Rails. Serving the file
# from tmpdir keeps uploads outside TCC's jurisdiction entirely.
module BrowserUploadHelpers
  def browser_uploadable_fixture(name)
    Pathname(Dir.tmpdir).join(name).tap do |path|
      FileUtils.cp(file_fixture(name), path)
    end
  end
end

RSpec.configure do |config|
  config.include BrowserUploadHelpers, type: :system
end
