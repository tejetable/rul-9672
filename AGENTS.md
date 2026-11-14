<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- All club data goes through src/lib/dataService.ts with a Cloud-backed in-memory read cache and async writes; browser storage holds only SDK sessions and device/demo-view preferences.
- PostgreSQL owns visit uniqueness in Europe/Madrid, verification/repeat triggers, undo limits and role-checked statistics; legacy pure visit helpers remain only as testable reference, never for dashboard calculations.
- Render the member card through the shared Carne component in both activation and member views; keep identification QR data unchanged so the business scanner remains compatible.
- Display both physical-card faces from the uploaded artwork with the member number overlaid; keep digital identification outside the artwork to preserve the printed design.
- Member and business notice bells share AvisosCampana; opening it marks only the current audience's notices as read through dataService.
- Match cards use pure helpers in src/lib/partidos.ts for Madrid-time countdowns and ICS exports so date behavior is independently tested.
- Match selection and Madrid form conversion use src/lib/partidos.ts; PostgreSQL's estadisticas_liga owns totals and recent-first form, and guardar_resultado_partido saves results and optional ranking atomically so every role sees the same league data.
- Gallery reads use the authenticated getDriveGallery server function and a ten-minute Cloud cache; drive-gallery.ts owns EXIF dates, explicit-first match linking and day-seeded highlights, never legacy filenames.
- Shared visual scales live in src/styles.css as Tailwind theme tokens; ClubCabecera provides compact headers and screens use semantic surface, heading, control and label roles.

- Verified email roles live in protected usuario_roles; RPCs bind them only to confirmed auth emails, guard assignments and keep session-scoped role selections in usuario_vista; browser role preferences never confer permissions.
- Sign-in uses managed Google OAuth or Cloud password auth; admin assignments stay role-checked and password invitations use authenticated server functions with role verification before admin access.
- Club WhatsApp comes from singleton Cloud settings through dataService; empty contact numbers hide club links and access messages use each member’s optional recipient number.
- Public settings reads use the explicitly projected ajustes_club_publicos view; the underlying settings and club email are readable only by Super admin so public contact links never expose administrative fields.
- Reserve the document scrollbar gutter and suppress duplicate Radix compensation; keep the member header sticky inside the app frame and full-screen overlays in portals to prevent layout shifts and clipping.

- Public membership applications call a validated RPC that returns only a request ID; payment approval is role-checked and transactional, with payment reference fields reserved for future verified payment callbacks.
- Welcome, email entry and role selection share AccesoVisual and semantic access tokens; password forms share validation and visibility controls; recovery and invitation links use public dedicated routes and Auth session verification.
