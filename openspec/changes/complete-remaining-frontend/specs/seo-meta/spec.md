## ADDED Requirements

### Requirement: Add Open Graph meta tags
The HTML `<head>` SHALL include Open Graph meta tags for social sharing previews.

#### Scenario: Link shared on social media shows preview
- **WHEN** a Season Me URL is shared on WeChat, Xiaohongshu, or other social platforms
- **THEN** the shared link SHALL display the OG title, description, and image

### Requirement: Add structured data
The HTML SHALL include JSON-LD structured data for WebApplication schema.

#### Scenario: Search engines understand the application
- **WHEN** Google or other search engines crawl the page
- **THEN** they SHALL parse the JSON-LD WebApplication schema

### Requirement: Add meta description
The HTML `<head>` SHALL include a `<meta name="description">` tag with a concise Chinese description.

#### Scenario: Search result shows description
- **WHEN** Season Me appears in search results
- **THEN** the meta description SHALL be displayed below the title
