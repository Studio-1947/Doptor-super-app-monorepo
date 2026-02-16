import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { eq } from "drizzle-orm";
import { users } from "../../../database/drizzle/schema/user.schema";
import { userRoles } from "../../../database/drizzle/schema/user-role.schema";
import { roles } from "../../../database/drizzle/schema/role.schema";
import { rolePermissions } from "../../../database/drizzle/schema/role-permission.schema";
import { permissions } from "../../../database/drizzle/schema/permission.schema";
import { DRIZZLE } from "../../../database/drizzle/database.module";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
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
    let userPermissions: any[] = [];

    if (roleIds.length > 0) {
      userPermissions = await this.db
        .select({
          action: permissions.action,
          resource: permissions.resource,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permission_id, permissions.id),
        )
        .where(eq(rolePermissions.role_id, roleIds[0])); // Simplified for now
    }

    return {
      ...user,
      roles: userRoleRecords.map((r) => ({ id: r.roleId, name: r.roleName })),
      permissions: userPermissions,
    };
  }
}
