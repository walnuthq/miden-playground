# Environment variables

Vite and Wrangler conventions: `.env` and `.env.[mode]` hold committed defaults, and `.env*.local` (git-ignored) holds personal overrides. The shell wins over both. Each app documents its variables in `.env.example`, and the README has the full table.

- `apps/api`: `DATABASE_URL` in the committed `.env` (the docker-compose database) is the one local database setting. drizzle-kit reads it, and so does `wrangler dev`, through `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=${DATABASE_URL}` in the same file, which overrides the Hyperdrive binding locally (there is no `localConnectionString` in `wrangler.jsonc`). Override it in `.env.local` or the shell. A remote `DATABASE_URL` exported in the shell (e.g. for a drizzle-kit command) also redirects a `wrangler dev` started from that shell. Production connects through the Hyperdrive `id` and never reads these files.
- Don't add a `.dev.vars` to `apps/api`: Wrangler ignores `.env` files when one exists. `apps/web/.dev.vars` exists on purpose, to keep the `VITE_*` files out of the Worker's local env.
