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
- [ ] Verify real participant data and signed poster access: blocked by no signed-in preview session. Video links target the requested `/book/v/:stepId` screens, which arrive in the next step.