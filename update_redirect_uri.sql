UPDATE "GoogleAuthConfig" 
SET "redirectUri" = 'http://localhost:3000/auth/google/callback' 
WHERE id = 'google-auth-config';

SELECT id, "redirectUri" FROM "GoogleAuthConfig" WHERE id = 'google-auth-config';
