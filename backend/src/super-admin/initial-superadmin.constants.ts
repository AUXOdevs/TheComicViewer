// backend/src/initial-superadmin/initial-superadmin.constants.ts

// ¡IMPORTANTE! Configura el Auth0 ID y email para el usuario 'superadmin' inicial.
// Este usuario se CREARÁ/ACTUALIZARÁ automáticamente en tu base de datos local
// con el rol 'superadmin' y permisos de administrador cuando el backend inicie.
// Asegúrate de que este AUTH0_SUPERADMIN_ID eventualmente corresponda al 'sub' (ID único)
// de una cuenta de usuario real en Auth0 que TÚ controlarás, para poder iniciar sesión
// y usar las funcionalidades de superadmin.

// export const AUTH0_SUPERADMIN_ID = 'auth0|generic_superadmin_id_12345'; // ID genérico para el superadmin inicial
// export const SUPERADMIN_EMAIL = 'superadmin@yourdomain.com'; // Email genérico
// export const SUPERADMIN_NAME = 'Super Admin User'; // Nombre genérico

export const AUTH0_SUPERADMIN_ID = 'google-oauth2|101067589744882004825'; // EJEMPLO: Reemplaza con el Auth0 ID real que usarás
export const SUPERADMIN_EMAIL = 'auxodevs@gmail.com'; // EJEMPLO: Reemplaza con el email real de tu superadmin
export const SUPERADMIN_NAME = 'Auxo SuperAdmin'; // EJEMPLO: Reemplaza con el nombre real de tu superadmin