import { createMongoAbility, AbilityBuilder } from "@casl/ability";

/**
 * Builds a CASL Ability object for the current user.
 *
 * Super Admin detection rules (must match backend):
 *   - user's role name is "SUPER_ADMIN" (case-insensitive)
 *   - OR a permission with module="all" and action="manage" exists
 *
 * Everyone else gets only their explicitly assigned DB permissions.
 * Role name strings like "ADMIN", "USER" do NOT grant blanket access.
 */
export function buildAbilityFor(permissions = [], user = null) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (!permissions || !Array.isArray(permissions)) {
    return build();
  }

  const roleName = extractRoleName(user).toUpperCase();

  // Super Admin bypass: ONLY for SUPER_ADMIN role or explicit all:manage permission
  const hasFullAccess =
    roleName === "SUPER_ADMIN" ||
    (Array.isArray(permissions) &&
      permissions.some((p) => {
        if (typeof p === "object" && p !== null) {
          return p.module === "all" && p.action === "manage";
        }
        return false;
      }));

  if (hasFullAccess) {
    can("manage", "all");
    return build();
  }

  // Register all explicitly assigned DB permissions
  permissions.forEach((perm) => {
    if (!perm) return;

    if (typeof perm === "object" && perm.action && perm.module) {
      const action = perm.action.trim().toLowerCase();
      const subject = perm.module.trim().toLowerCase();
      can(action, subject);

      // Register singular/plural/hyphen variants for seamless matching
      const norm = subject.replace(/_/g, "-");
      const unnorm = subject.replace(/-/g, "_");
      const sing = subject.endsWith("s") ? subject.slice(0, -1) : subject;
      const plur = subject.endsWith("s") ? subject : `${subject}s`;

      can(action, norm);
      can(action, unnorm);
      can(action, sing);
      can(action, plur);

      if (perm.name) {
        can(perm.name.toLowerCase(), subject);
        can(perm.name.toLowerCase(), norm);
        can(perm.name.toLowerCase(), unnorm);
      }
    }
  });

  return build();
}

/**
 * Extracts the role name string from various shapes of user/role data.
 */
function extractRoleName(user) {
  if (!user) return "";
  const raw =
    user?.roleRelation?.name ||
    user?.role?.name ||
    (typeof user?.role === "string" ? user.role : "") ||
    "";
  return typeof raw === "string" ? raw : String(raw);
}
