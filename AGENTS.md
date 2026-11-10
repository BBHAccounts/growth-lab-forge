# Architecture rules

- Keep book completion and unlocking in `src/lib/book.ts`, with Cloud calls in `book-api.ts`; this allows rule tests without browser or session dependencies.
- Store book step completion alongside existing programme responses under `__done`, retaining the full JSON and optional step metadata; this keeps ordinary Growth Lab models compatible.
- Validate book joining and model/media access in security-definer functions and RLS, never browser state; restrictive policies target book rows only to preserve existing programme access.
- Apply the semantic book theme at the application root and load its fonts once in the document head; shared BookLayout owns every retained page header.
- Share magic-link sending and onboarding with book entry; allow only validated same-origin book video return paths through book joining, since stored intent never grants membership.
- Derive book path states and week numbers in `book-path.ts` from the existing unlock/completion helpers; load only the current user's participant responses and keep visit records scoped to user and programme.
- Queue book notes and completion writes per exercise, retaining user/participant/field-scoped local drafts until confirmed saved; this prevents auto-save from overwriting completion or losing notes on navigation.
- Resolve root navigation from current-user book membership and protected admin checks; validate sign-in returns against retained same-origin routes.
- Admin book previews read BBHTEST chapter content without creating membership or reading any participant responses; previews never write notes or completion.
- Book admin progress pages use only the admin-checked `book_programme_progress` RPC; never fetch raw participant response JSON in admin reporting.
- Save book programme chapter order as one-based and ordinary programme task order as zero-based; chapter unlocking uses the persisted order index.
- Use scaffolded version-pinned email SDK handlers for account email verification and sending; preserve branded templates and leave non-queue third-party senders untouched during the managed email update.

- Render tagged active book tools through the retained ModelWorkspace under BookLayout and keep its activated-model progress contract; removed member routes must resolve to NotFound.
