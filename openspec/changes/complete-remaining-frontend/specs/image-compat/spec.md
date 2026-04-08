## ADDED Requirements

### Requirement: Quiz images load regardless of file extension case
All quiz image references in QUIZ_DATA SHALL use lowercase file extensions. The image file `images/IMG_0925.PNG` SHALL be renamed to `images/IMG_0925.jpg` (or the HTML reference SHALL match the actual filename).

#### Scenario: Quiz question 1 option B loads correctly
- **WHEN** the quiz renders question 1 and option B references `images/IMG_0925.jpg`
- **THEN** the image SHALL load without 404 errors on all platforms (iOS Safari, Chrome, etc.)

### Requirement: All image files use consistent lowercase extensions
All image files in the `images/` directory SHALL use `.jpg` or `.png` (lowercase) extensions.

#### Scenario: No uppercase extension files remain
- **WHEN** listing files in `images/` directory
- **THEN** all files SHALL have lowercase extensions (.jpg or .png)
