## ADDED Requirements

### Requirement: Detect localStorage quota exceeded
The `smse.set` and `smse.setJSON` methods SHALL catch `QuotaExceededError` and display a toast notification to the user.

#### Scenario: localStorage write fails due to quota
- **WHEN** a localStorage write exceeds the browser's storage quota (typically 5MB)
- **THEN** the system SHALL catch the error
- **THEN** the system SHALL display a toast: "存储空间不足，部分数据可能无法保存"

### Requirement: Estimate storage before photo save
Before saving a processed photo to localStorage, the system SHALL estimate the base64 size and warn if it exceeds 3MB.

#### Scenario: Large photo triggers size warning
- **WHEN** the processed photo data URL exceeds 3MB in base64 size
- **THEN** the system SHALL display a warning toast before saving
- **THEN** the system SHALL still proceed with saving (best effort)

### Requirement: Show current storage usage on demand
The `smse` utility SHALL expose a `getUsage()` method that returns current usage in bytes.

#### Scenario: Get storage usage
- **WHEN** `smse.getUsage()` is called
- **THEN** it SHALL return the total bytes used by all `smse_` prefixed keys
