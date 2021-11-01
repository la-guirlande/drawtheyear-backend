import Service from './service';
import ServiceContainer from './service-container';

/**
 * Permissions service class.
 * 
 * This service is used to manages roles and permissions.
 */
export default class PermissionService extends Service {

  public readonly defaultRole: Role;

  /**
   * Creates a new permissions service.
   * 
   * @param container Services container
   */
  public constructor(container: ServiceContainer) {
    super(container);
    const { roles } = this.container.config.services.permissions;
    this.defaultRole = Object.keys(roles).find(role => roles[role].default) as Role;
  }

  /**
   * Get role permissions.
   * 
   * @param role Role
   * @returns Role permissions
   */
  public getPermissions(role: Role): Permission[] {
    const roleConfig = this.container.config.services.permissions.roles[role];
    const perms = roleConfig.permissions as Permission[];
    (roleConfig.extends as Role[])?.forEach(extend => perms.push(...this.getPermissions(extend)));
    return perms;
  }
}

/**
 * Role.
 */
export type Role = 'user' | 'admin';

/**
 * Permission.
 */
export type Permission
  = 'abcd'
  | 'efgh'
  | '1234'
  | '5678';
