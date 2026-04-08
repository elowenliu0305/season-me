## ADDED Requirements

### Requirement: Dark mode CSS variables
The application SHALL define a set of dark mode CSS variables under `[data-theme="dark"]` selector, overriding the default light variables for base background, text colors, and UI chrome. Season-specific variables (accent-color, palette-*) SHALL NOT be overridden by dark mode.

#### Scenario: Dark mode changes background and text
- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--base-bg` SHALL be a dark value (near black)
- **THEN** `--text-main` SHALL be a light value (near white)
- **THEN** `--text-secondary` SHALL be a muted light value

### Requirement: Follow system dark mode preference
On first visit (no saved preference), the application SHALL default to the system's `prefers-color-scheme` setting.

#### Scenario: System prefers dark mode
- **WHEN** a new user visits with `prefers-color-scheme: dark` and no saved theme preference
- **THEN** the application SHALL activate dark mode

#### Scenario: System prefers light mode
- **WHEN** a new user visits with `prefers-color-scheme: light` and no saved theme preference
- **THEN** the application SHALL use light mode

### Requirement: Manual dark mode toggle
The application SHALL provide a toggle button to switch between light and dark mode. The toggle SHALL be accessible from the Cover page.

#### Scenario: User toggles to dark mode
- **WHEN** the user taps the dark mode toggle on the Cover page
- **THEN** the application SHALL switch to dark mode
- **THEN** the preference SHALL be saved to localStorage as `smse_theme`

#### Scenario: User toggles to light mode
- **WHEN** the user taps the dark mode toggle while in dark mode
- **THEN** the application SHALL switch to light mode
- **THEN** the preference SHALL be saved to localStorage as `smse_theme`

### Requirement: Dark mode preserves season theme
Switching between dark and light mode SHALL NOT change the active season theme (accent colors, palette).

#### Scenario: Dark mode with Bright Spring theme
- **WHEN** the user is in Bright Spring theme and switches to dark mode
- **THEN** the accent color SHALL remain `#F4A261`
- **THEN** the palette colors SHALL remain unchanged
- **THEN** only the base background and text colors SHALL change

### Requirement: Dark mode compatible with share card
The share card export SHALL use season theme colors regardless of dark/light mode setting.

#### Scenario: Share card renders correctly in dark mode
- **WHEN** the user generates a share card while in dark mode
- **THEN** the share card SHALL use the season's accent-color as background
- **THEN** the share card content SHALL NOT be affected by dark mode CSS variables
