# Architecture rules

- Keep book completion and unrestricted chapter exploration in `src/lib/book.ts`, with Cloud calls in `book-api.ts`; chapter dates guide ordering but never gate access.
- Store book step completion alongside existing programme responses under `__done`, retaining the full JSON and optional step metadata; this keeps ordinary Growth Lab models compatible.
- Validate book joining and model/media access in security-definer functions and RLS, never browser state; restrictive policies target book rows only to preserve existing programme access.
- Apply the semantic book theme at the application root and load its fonts once in the document head; shared BookLayout owns every retained page header.
- Share magic-link sending and onboarding with book entry; allow only validated same-origin book video return paths through book joining, since stored intent never grants membership.
- Derive book path states and week numbers in `book-path.ts` from the existing unlock/completion helpers; load only the current user's participant responses and keep visit records scoped to user and programme.
- Queue book notes and completion writes per exercise, retaining user/participant/field-scoped local drafts until confirmed saved; this prevents auto-save from overwriting completion or losing notes on navigation.
- Resolve root navigation from current-user book membership and protected admin checks; validate sign-in returns against retained same-origin routes.
- Admin book previews read BBHTEST chapter content without creating membership or reading any participant responses; previews never write notes or completion.
- Keep actual participant membership separate from admin preview access in book entry; only membership bypasses joining, so admins can explicitly enrol for personal progress using the existing secure code flow.
- Book admin progress pages use only the admin-checked `book_programme_progress` RPC; never fetch raw participant response JSON in admin reporting.
- Save book programme chapter order as one-based and ordinary programme task order as zero-based; chapter unlocking uses the persisted order index.
- Use scaffolded version-pinned email SDK handlers for account email verification and sending; preserve branded templates and leave non-queue third-party senders untouched during the managed email update.

- Render all active non-chapter models through the book library detail and retained ModelWorkspace under BookLayout, keeping its activated-model progress contract; legacy model routes redirect to the library while other removed routes resolve to NotFound.
- Derive chapter filters and admin chapter selection from shared model-library tag helpers, preserving unrelated tags; model access is enforced by the existing book-access function and unchanged RLS.

- Share Cloud email OTP sending and verification between auth and book joining; hosted OTP length remains an owner setting, never generate codes locally.
- Share the BBH email layout across all six scaffolded auth templates and pass Cloud-issued tokens to signup and sign-in emails; preserve SDK dispatch and signature handling.
- Keep pathway chapter exploration in a themed accessible dialog on BookHome, including next-chapter navigation; this preserves the path context and handles legacy chapter links without a separate screen.
- Keep reminder content as an immutable typed source, build clipboard and lazy Word exports from it, and share one public-app URL config; preview-generated links must target the live app without sending emails or changing stored data.
- Store programme reminder grants in a dedicated protected assignment table; expose only reminder programme metadata through the authenticated RPC so coordinators never receive participant or note access.
- Check reminder programme codes against the current user's own enrolments before returning from joining; a membership in another book programme must not bypass the requested firm-code flow, and existing server access checks remain authoritative.
- Derive visible video numbers from chapter order and step position through bookVideoNumber; retain original step IDs for stored progress, URLs and immutable reminder copy.
- Keep the constellation pathway still at rest; only chapter transitions move its viewing marker, independently of persisted exercise progress and with reduced-motion support.
