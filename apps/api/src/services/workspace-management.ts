export interface WorkspaceUserSummary {
  email: string;
  name: string | null;
  isAdmin: boolean;
  role: string;
}

export function pickWorkspacePrimaryUser(
  users: WorkspaceUserSummary[]
): WorkspaceUserSummary | null {
  if (!users.length) return null;

  const systemAdmin = users.find((user) => user.role === "SYSTEM_ADMIN");
  if (systemAdmin) return systemAdmin;

  const adminUser = users.find((user) => user.isAdmin);
  if (adminUser) return adminUser;

  return users[0];
}
