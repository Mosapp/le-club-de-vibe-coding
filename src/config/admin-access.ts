type AdminIdentity = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
};

const splitConfig = (value: string | undefined) =>
  (value ?? "")
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const adminIds = new Set(splitConfig(import.meta.env.VITE_ADMIN_MEMBER_IDS));
const adminNames = new Set(
  splitConfig(import.meta.env.VITE_ADMIN_NAMES).map((name) => name.toLocaleLowerCase()),
);

const fullName = (member: Pick<AdminIdentity, "firstName" | "lastName">) =>
  `${member.firstName} ${member.lastName}`.trim().toLocaleLowerCase();

export function isConfiguredAdmin(member: AdminIdentity | null) {
  if (!member || member.status !== "ACTIVE") return false;
  return adminIds.has(member.id) || adminNames.has(fullName(member));
}
