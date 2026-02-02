# Historical Data of Screen Sizes and Resolutions

This project is a web app that visually displays the screen sizes of many devices.
The visuals are similar to [screensizemap.com](https://screensizemap.com/) but with a historical perspective and per device data.

The devices are ordered by their release date and can be filtered by various criteria such as release date, size, pixel density, manufacturer, and more.

Unauthorized users can view the data visually or in a table format. They can also suggest new devices.

Authorized admins can add, edit, or delete devices and their specifications. They can approve or reject user suggestions, which will then be added to the visualizations.

## Functional Requirements

**User Story 1: View device visualizations (Prio “Must”)**
As an unauthorized user, I want to visually explore screen sizes and resolutions of devices over time, so that I can understand historical trends.

Acceptance Criteria
 * Devices are displayed in a visual layout comparable to screensizemap.com.
 * Each device visualization reflects its physical screen size and resolution.
 * Only approved devices are shown.
 * A horizontal timeline indicates release dates and allows scrolling through time.


**User Story 2: View device data in table form (Prio “Could”)**
As an unauthorized user, I want to view all devices in a table, so that I can compare exact specifications.

Acceptance Criteria
 * The table lists all approved devices.
 * Each row includes at least: device name, manufacturer, release year, screen size, resolution and pixel density.
 * Sorting by release date is possible.

**User Story 3: Filter devices (Prio “Must”)**
As a user, I want to filter devices by various criteria, so that I can narrow down the dataset.

Acceptance Criteria
 * Devices can be filtered by:
 * Release date (range)
 * Pixel density (range)
 * Manufacturer
 * Filters apply to both visual and table views.
 * Multiple filters can be combined.

**User Story 4: Suggest a new device (Prio “Should”)**
As an unauthorized user, I want to suggest a new device, so that missing historical data can be added.

Acceptance Criteria
 * A suggestion form is available without authentication.
 * All the required properties have to be provided.
 * Suggested devices are not publicly visible until approved.
 * Suggestions are stored for admin review.

**User Story 5: Admin authentication (Prio “Must”)**
As an admin, I want to log into the admin area, so that I can manage device data.

Acceptance Criteria
 * Login requires email and password.
 * Invalid credentials prevent access.

**User Story 6: Manage devices (Prio “Must”)**
As an admin, I want to add, edit, or delete devices, so that the dataset remains accurate.

Acceptance Criteria
 * A device includes at least:
 * Name (required)
 * Manufacturer (required)
 * Release date (required)
 * Screen size (required)
 * Resolution (required)
 * Pixel density (computed from screen size and resolution)
 * Devices cannot be saved if required fields are missing.
 * Changes are persisted immediately.

**User Story 7: Review suggestions (Prio “Should”)**
As an admin, I want to review user suggestions, so that I can curate the dataset.

Acceptance Criteria
 * All suggestions are visible in the admin area.
 * A suggestion can be approved or rejected.
 * Approved suggestions create a new device entry.
 * Rejected suggestions are deleted.

## Quality Requirements
 * The public visualization must be usable on desktop, tablet, and mobile devices.
 * The public visualization must load within 1 second on a 4G connection.
 * Administrative actions (create, update, delete, approve) are logged.
 * Core functionality is covered by automated unit and integration tests.

## Architecture

 * Frontend: Angular
 * Backend: Node.js with Express
 * Database: MongoDB

