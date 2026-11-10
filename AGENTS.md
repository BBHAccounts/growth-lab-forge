# Architecture rules

- Keep book completion and unlocking in `src/lib/book.ts`, with Cloud calls in `book-api.ts`; this allows rule tests without browser or session dependencies.
- Store book step completion alongside existing programme responses under `__done`, retaining the full JSON and optional step metadata; this keeps ordinary Growth Lab models compatible.
- Validate book joining and model/media access in security-definer functions and RLS, never browser state; restrictive policies target book rows only to preserve existing programme access.