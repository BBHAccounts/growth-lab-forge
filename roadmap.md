# Beyond the Book preparation

## Mobile path and exercises

- [x] Fit video players and exercise grids on narrow phones, wrap long actions and refine mobile cards, sign-in fields and bottom tabs.
- [x] Apply chapter-dialog sizing to its themed portal root so phone pop-ups are visible, scrollable and clear of navigation.
- [x] Verify joining, path, chapter next/close and real completion/undo at 320, 390 and 768 pixels; all 51 tests pass.

## Personal path joining

- [x] Separate actual enrolment from read-only admin preview when opening the firm-code join page.
- [x] Replace disabled preview completion with explicit joining links on the path and exercise pages.
- [x] Verify the current account joins BBHTEST, returns to video 2B, saves completion across reload and can undo it; all 51 tests pass. Existing privacy and access policies unchanged.

## BBH constellation path

- [x] Replace the raised trail with an Ink constellation, Cream framing and compact progress header.
- [x] Retain real chapter titles, exercise completion, unrestricted exploration and chapter pop-ups; remove continuous motion.
- [x] Verify signed-in desktop/mobile path, all 15 chapter pop-ups, next-chapter navigation and reduced-motion transitions; 12 path/completion tests pass and no runtime errors.

## Firm reminder coordinators

- [x] Add protected admin-assigned programme coordinator grants and reminder-only metadata access, without changing existing note policies.
- [x] Add programme assignment controls, account-menu reminder access and shared copy/Word export pages.
- [x] Verify admin assignment, reminder copying, Word export and denied unknown/anonymous access; permission tests pass.
- [ ] Verify with a real non-admin coordinator account: no coordinator session is available in this turn.

## Pathway motion and softer perspective

- [x] Soften the trail and lower the chapter-stop viewing angle.
- [x] Animate in-progress chapter numbers and the current ring; move a viewing marker between chapters with reduced-motion support.
- [x] Verify real signed-in desktop/mobile navigation, marker movement and disabled animations under reduced motion; five path rule tests pass.

## Numbered videos and completion

- [x] Display chapter.video numbering and a numbered placeholder before playback.
- [x] Keep participant completion below exercises and show a disabled completion control with a joining explanation in read-only admin preview.
- [x] Verify real admin numbered chapters/exercise and sample-media play/overlay removal; all 44 tests pass. Participant completion persistence remains covered by existing rule tests, not a new member write.

## Programme reminder emails

- [x] Add Barbara's exact 45 emails, programme reminder tab, per-programme sender draft and rich/plain copy.
- [x] Export all reminders in order to Word with live video links and programme chapter dates.
- [x] Preserve reminder code and video destination through sign-in and programme joining using existing secure joining.
- [x] Verify real signed-in admin copy/export, sender reload, 45-page Word validation, desktop/mobile and signed-out/signed-in non-member links; 43 tests pass.
- [ ] Paste email 1A into real Outlook and Gmail: mailbox access is unavailable; rich HTML/plain clipboard and Word links are verified.

## Dimensional pathway and chapter pop-ups

- [x] Create a raised winding pathway with clearer current, started and completed states.
- [x] Open chapters in a large accessible pop-up on the path and remove the test-code preview label.
- [x] Verify real signed-in desktop/mobile chapter exploration, pop-up next/close and video navigation; 38 tests pass with no page errors.

## Design, open path and email codes

- [x] Upgrade the app-wide BBH design and use the official transparent BBH logo with matching favicon.
- [x] Replace weekly locks with a freely explorable connected chapter pathway, retaining progress and next-chapter guidance.
- [x] Use shared Cloud email-code sign-in and deploy all six rebranded account templates; existing verified sender domain retained.
- [x] 38 tests and sample-account chapter 15 exploration, notes/done persistence, code error/success and desktop/mobile checks pass. Email preview renders and the public logo loads.
- [ ] Owner must confirm More → Users → Auth settings → Email → Email OTP length is 6; this hosted setting cannot be changed or verified by agent tools. Real inbox delivery and account sign-in remain unverified because no requesting-user auth session is available.

## Full model library correction

- [x] Restore the full active-model library, details and legacy redirects in BBH design.
- [x] Widen only the book model-access function and verify its deployed definition preserves chapter access; confirm 12 active library models.
- [x] Add chapter multi-select in admin and update chapter links, participant model progress and menus.
- [x] Run 38 rule tests and sample-account search, filtering, saving/reload, legacy redirects, mobile layout and admin chapter save/reload checks.
- [ ] Real member saving/AI Coach and admin chapter selection checks: blocked because no auth account matches the requesting user; sign in in the preview to enable them.

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
## Email update

- [x] Inventory account and app senders; no legacy queue files or queue call sites exist.
- [x] Refresh account handler and preserve six branded templates; scaffold app-email helper and preview.
- [x] Deploy refreshed account handler and preview; unsigned requests correctly return 401, latest app build is OK and 19 related rule tests pass. No legacy suppression/unsubscribe surfaces exist, so no events receiver is needed. Inbox delivery remains unverified; leave publication to the user.


## Book-only application

- [x] Replace Growth Lab routes and navigation with one book header and BBH theme throughout.
- [x] Retain name and firm onboarding, account controls and tagged tool workspace with safe return routes.
- [x] Limit admin navigation and programmes to book surfaces; preserve progress-only note privacy.
- [x] Remove obsolete interface-only files; 33 rule tests and public/controlled desktop/mobile checks pass. No backend files or stored data were changed.
- [ ] Real email return, account changes, tool saving/coaching and admin progress checks: blocked because no auth account matches the requesting user. Media playback awaits uploaded videos.
