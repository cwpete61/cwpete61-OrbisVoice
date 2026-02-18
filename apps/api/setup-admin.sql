INSERT INTO "Tenant" (id, name, "createdAt", "updatedAt") VALUES ('admin-tenant-001', 'OrbisVoice Admin', NOW(), NOW()) ON CONFLICT DO NOTHING;
INSERT INTO "User" (id, email, name, "passwordHash", "tenantId", "createdAt", "updatedAt") 
VALUES (
  'admin-user-001',
  'admin@orbisvoice.app',
  'Admin',
  '$2b$10$wKcfq1n9XVDW.HxHLF5tQOXW5hP6VqrF9Jm5h0M0Pl/KzXfMQoKRm',
  'admin-tenant-001',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
SELECT COUNT(*) FROM "User";
