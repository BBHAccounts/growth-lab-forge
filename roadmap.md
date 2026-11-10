# Beyond the Book preparation

- [x] Add programme flags, secure joining and book model/media access.
- [x] Add shared completion and chapter unlock helpers with tests.
- [x] Create and verify the fifteen-chapter BBH test programme.
- [x] Verify existing sign-in and step metadata handling remain unchanged; no book screens.
- [ ] Signed-in joining, note saving and media access checks: blocked by unavailable preview session approval. Sign in in the preview to enable these checks.

## Step 2: firm code joining

- [x] Add scoped book styling, welcome, join and placeholder screens.
- [x] Preserve firm codes through magic link sign-in and the existing onboarding page.
- [x] Test return-path rules and controlled joining/redirect states; verify desktop and mobile layouts.
- [ ] Verify real magic-link delivery, onboarding and joining end to end: blocked by no signed-in preview session. Hosted return addresses are verified.

## Step 3: book path

- [x] Load the signed-in participant's chapters, responses, posters and derived chapter states.
- [x] Build the desktop path and mobile weekly/chapter views, with tools and notes placeholders.
- [x] Add completion comparison, accessible controls and populated responsive checks; test week and state rules.
- [ ] Verify real participant data and signed poster access: blocked by no signed-in preview session.

## Step 4: video and exercise

- [x] Add video page, locked state, linked tools and reminder-link return paths.
- [x] Add queued note auto-save with retained drafts, done/undo and book coaching.
- [x] Test save/undo/navigation rules and populated desktop/mobile flows: 22 tests pass; controlled saves, failure recovery, reload, coaching, next navigation and locked states pass without runtime errors. Real signed-out reminder redirect verified.
- [ ] Verify real signed-in note saving and coaching: blocked because session minting found no account matching the requesting user. Sign in in the preview to enable these checks. Video playback awaits uploaded media.

## Step 5: tools, notes and focused navigation

- [x] Add chapter-grouped tools and private notes with text download.
- [x] Add book model return bar and focused navigation for book-only users.
- [x] Add read-only BBHTEST admin preview without membership or participant notes.
- [x] Verify rules and desktop/mobile screens: 29 tests pass, controlled actual-hook flows cover root redirect, mixed menu, restricted-level model/workspace access, notes download and admin preview without note reads or writes.
- [ ] Verify real signed-in book-only, mixed-user and admin accounts: blocked by unavailable preview session, as noted above.

## Step 6: book programme admin

- [x] Add book flag, generated firm codes, join-link copying and weekly dates to the existing form; retain chapter indices 1 to 15 on save.
- [x] Add admin-only progress summary function without note text; deployed function and unchanged restrictive private-note policy verified in the database.
- [x] Show sortable book progress and CSV export without fetching responses.
- [x] Verify code, date and privacy rules and admin views: five new tests pass; controlled form save, date picker, join link, progress sorting/export and ordinary response UI checks pass without page errors.
- [ ] Verify progress RPC with a real admin session and participant data: blocked by unavailable preview session. Read-only database tool cannot execute this auth-only function.