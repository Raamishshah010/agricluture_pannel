const CANCELLED_ERRORS = new Set([
  "access_denied",
  "login_required",
  "invalid_request",
  "user_cancelled",
  "cancelled",
  "cancelledonapp",
  "cancelled_on_app",
]);

const ERROR_STATUS_KEYS = {
  access_denied: "auth.uaePassCancelledStatus",
  login_required: "auth.uaePassCancelledStatus",
  invalid_request: "auth.uaePassCancelledStatus",
  user_cancelled: "auth.uaePassCancelledStatus",
  cancelled: "auth.uaePassCancelledStatus",
  cancelledonapp: "auth.uaePassCancelledStatus",
  cancelled_on_app: "auth.uaePassCancelledStatus",
  missing_code: "auth.uaePassMissingCodeStatus",
  missing_state: "auth.uaePassMissingStateStatus",
  authorize_failed: "auth.uaePassAuthorizationFailedStatus",
  callback_failed: "auth.uaePassCallbackFailedStatus",
};

const UAE_PASS_ERROR_CASE_STATUS_KEYS = {
  cancelled_login: "auth.uaePassCancelledStatus",
  unverified_user: "auth.uaePassUnverifiedUserStatus",
  registered_users_only: "auth.uaePassRegisteredUsersOnlyStatus",
  uae_nationals_only: "auth.uaePassNationalsOnlyStatus",
  login_exception: "auth.uaePassLoginExceptionStatus",
};

const normalizeErrorKey = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

const humanizeErrorCode = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

export const isCancelledUaePassError = (error) =>
  CANCELLED_ERRORS.has(normalizeErrorKey(error));

export const getUaePassMappedMessage = (payload, t) => {
  const normalizedErrorCase = normalizeErrorKey(payload?.uaePassErrorCase);
  if (normalizedErrorCase && UAE_PASS_ERROR_CASE_STATUS_KEYS[normalizedErrorCase]) {
    return t(UAE_PASS_ERROR_CASE_STATUS_KEYS[normalizedErrorCase]);
  }

  const detailMessage = payload?.message || payload?.errorDescription || "";
  const normalizedDetailMessage = normalizeErrorKey(detailMessage);

  if (
    normalizedDetailMessage.includes("not_upgraded") ||
    normalizedDetailMessage.includes("unverified") ||
    normalizedDetailMessage.includes("visitor") ||
    normalizedDetailMessage.includes("profile_type")
  ) {
    return t("auth.uaePassUnverifiedUserStatus");
  }

  if (
    normalizedDetailMessage.includes("registered_user") ||
    normalizedDetailMessage.includes("existing_user") ||
    normalizedDetailMessage.includes("not_registered") ||
    normalizedDetailMessage.includes("not_admin")
  ) {
    return t("auth.uaePassRegisteredUsersOnlyStatus");
  }

  if (
    normalizedDetailMessage.includes("uae_national") ||
    normalizedDetailMessage.includes("uae_nationals") ||
    normalizedDetailMessage.includes("national_only") ||
    normalizedDetailMessage.includes("nationals_only")
  ) {
    return t("auth.uaePassNationalsOnlyStatus");
  }

  return "";
};

export const getUaePassOutcome = (payload, t) => {
  const normalizedError = normalizeErrorKey(payload?.error);
  const detailMessage = payload?.message || payload?.errorDescription || "";
  const normalizedDetailMessage = normalizeErrorKey(detailMessage);
  const mappedMessage = getUaePassMappedMessage(payload, t);

  if (
    payload?.cancelled ||
    isCancelledUaePassError(normalizedError) ||
    normalizedDetailMessage.includes("cancel")
  ) {
    return {
      kind: "cancelled",
      statusMessage: mappedMessage || t(ERROR_STATUS_KEYS[normalizedError] || "auth.uaePassCancelledStatus"),
      errorMessage: detailMessage || t("auth.uaePassCancelledDetail"),
    };
  }

  if (normalizedError) {
    return {
      kind: "error",
      statusMessage:
        mappedMessage ||
        t(ERROR_STATUS_KEYS[normalizedError] || "auth.uaePassLoginExceptionStatus"),
      errorMessage: detailMessage || humanizeErrorCode(normalizedError),
    };
  }

  return {
    kind: "success",
    statusMessage: t("auth.loginCompleted"),
    errorMessage: "",
  };
};
