# Architecture rules

- Keep book completion and unlocking in `src/lib/book.ts`, with Cloud calls in `book-api.ts`; this allows rule tests without browser or session dependencies.
- Store book step completion alongside existing programme responses under `__done`, retaining the full JSON and optional step metadata; this keeps ordinary Growth Lab models compatible.
- Validate book joining and model/media access in security-definer functions and RLS, never browser state; restrictive policies target book rows only to preserve existing programme access.
- Scope book typography and colours to `BookLayout` and `.theme-book`, loading fonts only while the book flow is mounted; this preserves Growth Lab styling.
- Share magic-link sending and onboarding with book entry; allow only validated same-origin book video return paths through book joining, since stored intent never grants membership.
- Derive book path states and week numbers in `book-path.ts` from the existing unlock/completion helpers; load only the current user's participant responses and keep visit records scoped to user and programme.
- Queue book notes and completion writes per exercise, retaining user/participant/field-scoped local drafts until confirmed saved; this prevents auto-save from overwriting completion or losing notes on navigation.
- Resolve book-focused navigation from current-user programme memberships, protected admin checks and self-activated models; share the result through the query cache so ordinary Growth Lab navigation stays unchanged.
- Admin book previews read BBHTEST chapter content without creating membership or reading any participant responses; previews never write notes or completion.