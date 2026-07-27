import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { eq, inArray } from "drizzle-orm";
import { users } from "../../../database/drizzle/schema/user.schema";
import { userRoles } from "../../../database/drizzle/schema/user-role.schema";
import { roles } from "../../../database/drizzle/schema/role.schema";
import { rolePermissions } from "../../../database/drizzle/schema/role-permission.schema";
import { permissions } from "../../../database/drizzle/schema/permission.schema";
import { DRIZZLE } from "../../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { requireJwtSecret } from "../../../common/config/jwt-secret";
import {
  ACCESS_TOKEN_COOKIE,
  readCookie,
} from "../../../common/config/auth-cookies";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {
    super({
      // Cookie first, Bearer second. Browsers use the httpOnly cookie so an XSS
      // can't read the token; everything else (smoke suites, curl, the mobile
      // app) keeps working over the header. Order matters only when both are
      // present, where the cookie is the more trustworthy of the two — a header
      // is the easier of the pair for injected script to attach.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => readCookie(req as any, ACCESS_TOKEN_COOKIE),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: any) {
    // Get user
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        email_verified: users.email_verified,
        organisation_id: users.organisation_id,
        first_name: users.first_name,
        last_name: users.last_name,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Get user roles
    const userRoleRecords = await this.db
      .select({
        roleId: roles.id,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.role_id, roles.id))
      .where(eq(userRoles.user_id, user.id));

    // Get permissions for all user roles
    const roleIds = userRoleRecords.map((r) => r.roleId);
    let userPermissions: { action: string; resource: string }[] = [];

    if (roleIds.length > 0) {
      const rawPermissions = await this.db
        .select({
          action: permissions.action,
          resource: permissions.resource,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permission_id, permissions.id),
        )
        .where(inArray(rolePermissions.role_id, roleIds));

      const dedupeMap = new Map(
        rawPermissions.map((p) => [`${p.action}:${p.resource}`, p]),
      );
      userPermissions = Array.from(dedupeMap.values());
    }

    return {
      ...user,
      roles: userRoleRecords.map((r) => ({ id: r.roleId, name: r.roleName })),
      permissions: userPermissions,
    };
  }
}
