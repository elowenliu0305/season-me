## ADDED Requirements

### Requirement: Share card maintains 3:4 aspect ratio on all devices
The share card `#share-card` SHALL maintain a strict 3:4 aspect ratio (width:height) on all screen sizes and devices.

#### Scenario: Share card ratio on iPhone
- **WHEN** the share card is rendered on iPhone (375px viewport)
- **THEN** the rendered share card SHALL have a 3:4 width-to-height ratio

#### Scenario: Share card in html2canvas output
- **WHEN** html2canvas captures the share card
- **THEN** the resulting canvas SHALL have a 3:4 aspect ratio

### Requirement: Share card content fits without overflow
All share card content (watermark, avatar, nickname, label, copy, palette, brand) SHALL fit within the card boundaries without clipping or overflow.

#### Scenario: Long nickname fits in card
- **WHEN** the user has a 20-character nickname
- **THEN** the nickname SHALL be displayed without overflowing the card width
- **THEN** the text SHALL be truncated or scaled if necessary
