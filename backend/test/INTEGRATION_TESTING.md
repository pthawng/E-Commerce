# Backend integration test setup

Integration tests must run against an isolated test database. They should not reuse
development or production databases.

## Back-office auth integration

1. Copy `.env.test.example` to `.env.test`.
2. Point `DATABASE_URL` at an isolated PostgreSQL database, for example
   `ray_paradis_test`.
3. Apply schema:
   `dotenv -e .env.test -- npx prisma migrate deploy`
4. Seed the required baseline data, including a `SUPER_ADMIN` user:
   `dotenv -e .env.test -- npm run seed`
5. Run the auth integration spec:
   `npm run test:back-office-auth`

The spec intentionally fails fast when the database does not contain an active
`SUPER_ADMIN`. That user is the authorization actor for staff invitation tests,
so bypassing it would weaken the production security boundary being tested.
