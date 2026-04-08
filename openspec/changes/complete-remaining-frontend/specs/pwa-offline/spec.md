## ADDED Requirements

### Requirement: Register service worker on load
The application SHALL register `sw.js` service worker on DOMContentLoaded.

#### Scenario: Service worker registration succeeds
- **WHEN** the page loads in a browser that supports service workers
- **THEN** the service worker SHALL be registered from `/sw.js`
- **THEN** subsequent page loads SHALL be served from cache (cache-first strategy)

### Requirement: Service worker caches app shell
The service worker SHALL pre-cache the application shell files: `index.html`, `style.css`, `app.js`.

#### Scenario: Offline page load
- **WHEN** the user loads Season Me while offline (after first visit)
- **THEN** the app shell (HTML, CSS, JS) SHALL be served from cache
- **THEN** the application SHALL function normally (except camera/upload features)

### Requirement: Service worker caches quiz images
The service worker SHALL cache quiz images on first fetch with a 30-day expiry.

#### Scenario: Quiz images available offline
- **WHEN** the user starts the quiz while offline (after viewing images at least once online)
- **THEN** all quiz images SHALL be displayed correctly

### Requirement: Add web app manifest
The application SHALL include a `manifest.json` with app name, icons, theme color, and display mode.

#### Scenario: Add to Home Screen
- **WHEN** the user taps "Add to Home Screen" on iOS or Android
- **THEN** the app SHALL be installed with the correct name, icon, and standalone display mode
