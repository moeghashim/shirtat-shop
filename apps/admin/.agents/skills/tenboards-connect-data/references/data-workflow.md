# Typed reads, schema and parity

Read `docs/data-layer.md` and the nearest domain before editing. Small example:
`src/server/data/users.ts`; complex filtering/date examples: `projects.ts`.

1. Put serializable types in `src/server/data/<domain>.types.ts`; validate inputs with
   the installed Zod. Preserve numbers, nulls, ordering and date semantics across sources.
2. Canonical fixtures belong in `src/server/db/fixtures/`. Demo functions return fresh
   data (`structuredClone` for static fixtures), so caller mutation cannot leak across requests.
3. DB functions dynamically import `getDatabase` from `client.server.ts` and schema;
   use normalized entity tables and ordered queries. Workers clients are request-scoped.
   Apply validated filters before limits, then project exactly the same output shape.
4. Export `read<Domain>` using `readSource(() => demo(input), () => db(input))`.
   No DATABASE_URL means demo; DATA_SOURCE=demo explicitly forces demo. Configured
   unreachable/unmigrated databases produce a sanitized visible error, not demo fallback.
5. Follow `./scripts/templates/load.ts.template`: `createServerFn({ method: "GET" })`,
   dynamic server imports, `await requireSession()` before the read. Route loaders
   call this function; components receive loader data and type-only imports.
6. Extend `src/server/db/schema.ts` and generate an additive migration with
   `npm run db:generate`. Inspect SQL before applying it. Keep shipped migrations intact.
   Seed from canonical fixtures with stable keys; preserve unrelated and adopter rows.
7. Register distinct demo/DB implementations in `src/server/data/registry.ts` with
   all/existing/missing/filter/empty scenarios as applicable. Date-relative records use
   one serialized request reference; test later requests without reseeding.

For a disposable local Postgres database, explicitly set its DATABASE_URL outside
committed files, then run `npm run db:migrate`, `npm run db:seed`, and
`npm run data:parity`. The parity runner checks every exported read is registered,
compares actual outputs and verifies caller mutation isolation. Repeated seed and
populated upgrades must retain unrelated records. Do not run remote migrations/seeds
without explicit authorization; never print credentials in evidence.

The generator intentionally emits an illustrative DB stub. It is useful for a demo
page, but is not evidence of a schema, query or seed. For demo-only work keep its TODO
and describe that limitation rather than inventing persistence.
