# Architecture rules

- Keep book completion and unlocking in `src/lib/book.ts`, with Cloud calls in `book-api.ts`; this allows rule tests without browser or session dependencies.
- Store book step completion alongside existing programme responses under `__done`, retaining the full JSON and optional step metadata; this keeps ordinary Growth Lab models compatible.
- Validate book joining and model/media access in security-definer functions and RLS, never browser state; restrictive policies target book rows only to preserve existing programme access.
- Scope book typography and colours to `BookLayout` and `.theme-book`, loading fonts only while the book flow is mounted; this preserves Growth Lab styling.
- Share the existing magic-link sending function and onboarding page with book entry, retaining a fixed same-origin return path and firm code only; stored intent never grants membership.
- Derive book path states and week numbers in `book-path.ts` from the existing unlock/completion helpers; load only the current user's participant responses and keep visit records scoped to user and programme.