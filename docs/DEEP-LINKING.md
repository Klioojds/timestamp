# Deep Linking & Landing Page

Configure and share countdowns directly through URL parameters or the landing
page form. **Valid deep links automatically start the countdown** - no extra
parameters needed!

The app fully supports browser back/forward navigation, automatically updating
URLs when settings change, and preserving your configuration across navigation.

## Supported Parameters

| Parameter | Required | Values | Description | Default |
|-----------|----------|--------|-------------|---------|
| mode | No | wall-clock \| absolute \| timer | Countdown mode | wall-clock |
| target | No | ISO8601 date | Target date for wall-clock/absolute mode | next New Year (landing default) |
| duration | No | number (seconds) | Duration for timer mode (1-31,536,000) | - |
| message | No | URL encoded string | Custom completion message (max 200 chars) | Time's up! |
| theme | No | contribution-graph \| fireworks | Theme identifier | contribution-graph |
| tz | No | IANA timezone | Timezone identifier | User timezone |
| configure | No | true | Show landing page for configuration first | false |
| showWorldMap | No | true \| false | Show world map on countdown display | true |

### Mode Details

- **wall-clock**: Target string must NOT end with `Z` (e.g., `2026-01-01T00:00:00`). Each timezone celebrates independently.
- **absolute**: Target string must end with `Z` (e.g., `2026-01-01T00:00:00Z`). Everyone counts to the same UTC instant.
- **timer**: Uses `duration` parameter instead of `target`. Timezone-independent.

## Examples

### Direct Countdown Launch (Default Behavior)

- Local Time mode (per timezone, e.g. New Year's Eve):
  - `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph`
- Same Moment mode (one instant, e.g. product launch):
  - `/?mode=absolute&target=2026-01-01T00:00:00Z&theme=contribution-graph`
- Timer mode (fixed duration countdown):
  - `/?mode=timer&duration=300&theme=fireworks`
- Local Time with timezone:
  - `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph&tz=Europe/London`

### Landing Page Configuration

Use `configure=true` to show the landing page with pre-filled values:

- `/?mode=timer&duration=300&configure=true`
- `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph&configure=true`

### World Map Control

- Local Time mode with world map hidden:
  - `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph&showWorldMap=false`
- Local Time mode with world map explicitly shown (default):
  - `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph&showWorldMap=true`
- Timer mode (world map not shown):
  - `/?mode=timer&duration=300&theme=fireworks`

### Complete Examples

Local Time countdown with all preferences:

- `/?mode=wall-clock&target=2026-01-01T00:00:00&theme=contribution-graph&tz=Europe/London&showWorldMap=true`

Same Moment countdown for global event:

- `/?mode=absolute&target=2026-01-01T12:00:00Z&theme=fireworks&message=We're%20live!`

Timer with custom message:

- `/?mode=timer&duration=300&message=Coffee%20break!&theme=fireworks`

## Browser Navigation

The app fully supports browser back/forward buttons:

- **Browser Back Button**: Returns to landing page from countdown view, preserving your previous form values
- **Browser Forward Button**: Returns to countdown after navigating back
- **Page Refresh**: Restores countdown state from URL parameters
- **Landing Page "Setup" Button**: Allows forward navigation back to countdown

When you modify settings (theme, timezone) during countdown, the URL updates
automatically using `replaceState`, keeping the URL shareable without cluttering
browser history.

## Behavioral Notes

- **Automatic Countdown Launch**: Valid deep links automatically start the
  countdown - no extra parameters needed
- **Landing Page Override**: Add `configure=true` to show the landing page with
  pre-filled values instead of auto-starting
- **Theme Switching**: When you switch themes during countdown, the URL updates
  to keep the link shareable without adding history entries
- **Timezone Changes**: Changing timezone recalculates the target date and
  updates the URL
- **World Map Toggle**: Only applies to Local Time and Same Moment modes; Timer
  mode never displays the world map since timezone doesn't affect duration-based
  countdowns
- **History State**: The app stores your full countdown configuration in browser
  history, so navigating back/forward preserves all your settings
- **Messages**: HTML-sanitized and truncated to 200 characters
- **Invalid Parameters**: Incomplete parameter sets fall back to the landing page and display an error toast

## Troubleshooting

**Q: My deep link takes me to the landing page instead of starting the
countdown**  
A: Ensure all required parameters for your mode are valid. Local Time and Same
Moment modes require `target`, Timer mode requires `duration`. For Local Time
mode (`wall-clock`), ensure your target does NOT end with `Z`; for Same Moment
mode (`absolute`), it MUST end with `Z`. Check the browser console for
validation errors. If you intentionally want to show the landing page with
pre-filled values, add `configure=true`.

**Q: Browser back button doesn't work**  
A: Ensure JavaScript is enabled. The app uses the History API for navigation.
If the issue persists, try refreshing the page.

**Q: `showWorldMap` parameter ignored**  
A: This parameter only applies to wall-clock and absolute modes. Timer mode
never displays the world map since timezone doesn't affect duration-based
countdowns.
