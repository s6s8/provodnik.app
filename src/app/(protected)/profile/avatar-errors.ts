const AVATAR_SIZE_ERROR = "Файл больше 2 МБ — выбери поменьше";
const AVATAR_MIME_ERROR = "Поддерживаются только JPG, PNG, WEBP";
const AVATAR_SUCCESS = "Аватар обновлён";
const AVATAR_GENERIC_ERROR = "Не удалось загрузить — попробуй ещё раз";

export const AVATAR_MESSAGES = {
  SIZE_ERROR: AVATAR_SIZE_ERROR,
  MIME_ERROR: AVATAR_MIME_ERROR,
  SUCCESS: AVATAR_SUCCESS,
  GENERIC_ERROR: AVATAR_GENERIC_ERROR,
} as const;

export class AdminRoleNotAllowedError extends Error {
  constructor() {
    super("Admins do not get avatars.");
    this.name = "AdminRoleNotAllowedError";
  }
}

export type AvatarUploadResult =
  | { ok: true; message: typeof AVATAR_SUCCESS }
  | {
      ok: false;
      message:
        | typeof AVATAR_SIZE_ERROR
        | typeof AVATAR_MIME_ERROR
        | typeof AVATAR_GENERIC_ERROR;
    };
