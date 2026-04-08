## ADDED Requirements

### Requirement: Load Plausible analytics script
The HTML SHALL include the Plausible analytics script with `defer` attribute.

#### Scenario: Plausible script loads
- **WHEN** the page loads
- **THEN** the Plausible script SHALL be loaded with `defer`
- **THEN** the script SHALL NOT block page rendering

### Requirement: Track key conversion events
The application SHALL send custom events to Plausible for key user actions: starting the quiz, completing the quiz, generating share card, and saving the image.

#### Scenario: User starts quiz
- **WHEN** the user clicks "NEXT" on the Identity page and navigates to Quiz
- **THEN** a `QuizStarted` event SHALL be sent to Plausible

#### Scenario: User completes quiz
- **WHEN** the Darkroom analysis completes and navigates to Story page
- **THEN** a `QuizCompleted` event SHALL be sent to Plausible

#### Scenario: User generates share card
- **WHEN** the user navigates to the Export page
- **THEN** a `ShareCardGenerated` event SHALL be sent to Plausible

#### Scenario: User saves image
- **WHEN** the user clicks "SAVE TO CAMERA ROLL" or "GO PUBLISH"
- **THEN** a `ImageSaved` event SHALL be sent to Plausible
