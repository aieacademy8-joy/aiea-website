# Portal source boundary — Sprint 01A

The website is static HTML/CSS/JavaScript with CommonJS Node serverless functions
under `/api`. No framework migration, bundler, Supabase SDK, Portal route, login UI,
or production provider wiring is required for this database foundation.

Database code lives in `supabase/migrations`; executable database cases live in
`supabase/tests`; offline repository validation lives in `scripts/portal`.
The `portal` PostgreSQL schema is the future API boundary. `portal_private` is
never an exposed Data API schema. Existing download checkout is independent.

Future Portal browser sources can live here; bounded server operations can live
under `/api/portal` after their implementation is explicitly authorized. Do not
add privileged handlers here or reuse a PDF/HMAC token as Portal authorization.
No source code currently consumes `.env.example`.
