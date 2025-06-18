import { SetMetadata } from '@nestjs/common';

// Define los nombres de los permisos que podemos verificar
export type AdminPermission =
  | 'content_permission'
  | 'user_permission'
  | 'moderation_permission';

// Clave para almacenar los permisos requeridos en los metadatos de la ruta
export const PERMISSIONS_KEY = 'permissions';

// Decorador para especificar los permisos granulares requeridos en una ruta
export const RequiredPermissions = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
