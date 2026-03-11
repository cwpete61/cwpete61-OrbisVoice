---
description: Implement native Google Authentication using Auth.js (NextAuth v5), Prisma, and PostgreSQL, following the pattern from the nextjs-google-auth repository.
---

# Native Google Auth Workflow (Auth.js)

This workflow guides the integration of native Google OAuth into the OrbisVoice monorepo, replacing external identity providers like Firebase with a self-hosted Auth.js implementation.

## Prerequisites
- Google Cloud Console project with OAuth 2.0 credentials.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` added to `.env`.
- `AUTH_SECRET` generated (e.g., via `openssl rand -base64 32`).

## Step 1: Install Dependencies
Navigate to `apps/web` and install the core Auth.js packages:

```bash
cd apps/web
npm install next-auth@beta @auth/prisma-adapter
```

## Step 2: Update Database Schema
Modify `apps/api/prisma/schema.prisma` to include the standard Auth.js models. Ensure the `User` model is extended rather than replaced.

### Add Models:
```prisma
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Update User model:
Add these fields to the `User` model if missing:
- `emailVerified DateTime?`
- `accounts      Account[]`
- `sessions      Session[]`

Run migration:
```bash
npx prisma migrate dev --name add_authjs_models
```

## Step 3: Configure Auth.js
Create `apps/web/src/auth.ts` to initialize the library:

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // Ensure this exports the PrismaClient instance

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      // Add tenantId or role if needed
      return session;
    },
  },
})
```

## Step 4: Create Route Handler
Create `apps/web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

## Step 5: Update Frontend
Replace Firebase login calls with Auth.js `signIn`:

```tsx
import { signIn } from "@/auth"

// In your component
<button onClick={() => signIn("google")}>
  Continue with Google
</button>
```

## Step 6: Verification
1. Ensure `NEXTAUTH_URL` is set in production.
2. Verify that clicking "Continue with Google" creates a `User` and `Account` in the database.
3. Test session persistence across page reloads.
