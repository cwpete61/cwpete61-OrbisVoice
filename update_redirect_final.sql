UPDATE "GoogleAuthConfig" 
SET "redirectUri" = 'http://localhost:3000/api/auth/callback/google' 
WHERE id = 'google-auth-config';

SELECT id, "redirectUri" FROM "GoogleAuthConfig" WHERE id = 'google-auth-config';
