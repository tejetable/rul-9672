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

- All app data goes through src/lib/dataService.ts (localStorage today) so the backend can be swapped without touching screens.
- Visit rules (1 per member/business/day, repeat detection, stats, 90-day goal) live as pure functions in src/lib/visitas.ts with tests, so screens and dataService share one source of truth.
- Render the member card through the shared Carne component in both activation and member views; keep identification QR data unchanged so the business scanner remains compatible.
- Display both physical-card faces from the uploaded artwork with the member number overlaid; keep digital identification outside the artwork to preserve the printed design.
- Member and business notice bells share AvisosCampana; opening it marks only the current audience's notices as read through dataService.
- Match cards use pure helpers in src/lib/partidos.ts for Madrid-time countdowns and ICS exports so date behavior is independently tested.
