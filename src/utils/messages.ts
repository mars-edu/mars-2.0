/**
 * Frontend i18n messages
 * These messages are used to translate error codes from the backend
 */

export type MessageKey =
  | "auth_username_required"
  | "auth_password_required"
  | "auth_invalid_credentials"
  | "auth_username_taken"
  | "auth_email_taken"
  | "auth_login_error"
  | "auth_firstname_required"
  | "auth_lastname_required"
  | "auth_password_min_length"
  | "auth_email_invalid"
  | "auth_registration_error"
  | "auth_token_required"
  | "auth_token_invalid"
  | "auth_token_validation_error"
  | "auth_unauthorized"
  | "auth_no_token"
  | "server_error"
  | "not_found"
  | "forbidden"
  | "bad_request";

export const messages: Record<MessageKey, string> = {
  auth_username_required: "Требуется имя пользователя",
  auth_password_required: "Требуется пароль",
  auth_invalid_credentials: "Неверные учетные данные",
  auth_username_taken: "Имя пользователя уже занято",
  auth_email_taken: "Email уже зарегистрирован",
  auth_login_error: "Произошла ошибка при входе",
  auth_firstname_required: "Требуется имя",
  auth_lastname_required: "Требуется фамилия",
  auth_password_min_length: "Пароль должен содержать минимум {minLength} символов",
  auth_email_invalid: "Неверный адрес электронной почты",
  auth_registration_error: "Произошла ошибка при регистрации",
  auth_token_required: "Требуется токен",
  auth_token_invalid: "Недействительный или истекший токен",
  auth_token_validation_error: "Произошла ошибка при проверке сессии",
  auth_unauthorized: "Требуется аутентификация",
  auth_no_token: "Токен не предоставлен",
  server_error: "Произошла неожиданная ошибка сервера",
  not_found: "Ресурс не найден",
  forbidden: "Доступ запрещен",
  bad_request: "Неверный запрос",
};

/**
 * Translate a message key to a localized string
 * @param key - The message key
 * @param params - Optional parameters for string interpolation
 * @returns The translated message
 */
export function t(key: MessageKey, params?: Record<string, any>): string {
  let message = messages[key] || key;

  // Simple string interpolation
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      message = message.replace(`{${paramKey}}`, String(params[paramKey]));
    });
  }

  return message;
}
