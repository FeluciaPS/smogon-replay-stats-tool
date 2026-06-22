# v0.1.3
Bugfix update
- Fix width for FAQ popup
- Remove error when replay is forfeited/lost on preview

# v0.1.2
FAQ and small layout updates
- Added FAQ
- Threw in a font I happened to have laying around in a different project, may change it later but it beats the default
- Fixed some minor layout spacing things on desktop (turns out mobile layout broke desktop OOPS)

# v0.1.1
The tool is now usable on mobile
- Drastically improved mobile layout

# v0.1.0
First public release (woo!)
- Match results are no longer bolded but instead hidden to avoid spoilers
- Added "copy to clipboard" button
- Added support for loading replays from a smogon thread
- Progress bar display when loading replays
- Cleaned up the code for a public release
- Replay loading now starts in the background the moment you paste a link in the box
- Loaded replays are cached during session 
- Added this file

# v0.0.1
Private release for feedback
- Core functionality works
  - bbcode is now generated, grouped by team matchup and sorted by tier
  - winner is bolded in match lines
  - Replays are always linked from winner POV
  - !!only supports PL-style team tours
- Added config step for tiers (ordered) and teams (with mascots)
- Team selection moved from text input to a dropdown based on config
- Removed "swap players" button for team tours
- Live updates: editing names/teams/format updates the display and BBCode output automatically

# v0.0.0
Proof of concept
- Replays are loaded, parsed, and displayed in the "review" section
  - User can edit smogon names, team names, and format names
  - User can swap the 2 players for output purposes
- BBCode rendering entirely unimplemented
- Smogon/PS name pairings are cached for future ease of use