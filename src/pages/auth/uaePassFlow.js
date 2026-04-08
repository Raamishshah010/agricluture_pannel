const CANCELLED_ERRORS = new Set(["access_denied", "user_cancelled", "cancelled", "cancelledonapp"]);

const ERROR_STATUS_KEYS = {
  access_denied: "auth.uaePassCancelledStatus",
  user_cancelled: "auth.uaePassCancelledStatus",
  cancelled: "auth.uaePassCancelledStatus",
  cancelledonapp: "auth.uaePassCancelledStatus",
  missing_code: "auth.uaePassMissingCodeStatus",
  missing_state: "auth.uaePassMissingStateStatus",
  authorize_failed: "auth.uaePassAuthorizationFailedStatus",
  callback_failed: "auth.uaePassCallbackFailedStatus",
};

const humanizeErrorCode = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

export const isCancelledUaePassError = (error) =>
  CANCELLED_ERRORS.has(String(error || "").toLowerCase());

export const getUaePassOutcome = (payload, t) => {
  const normalizedError = String(payload?.error || "").toLowerCase();
  const detailMessage = payload?.message || payload?.errorDescription || "";

  if (payload?.cancelled || isCancelledUaePassError(normalizedError)) {
    return {
      kind: "cancelled",
      statusMessage: t(ERROR_STATUS_KEYS[normalizedError] || "auth.uaePassCancelledStatus"),
      errorMessage: detailMessage || t("auth.uaePassCancelledDetail"),
    };
  }

  if (normalizedError) {
    return {
      kind: "error",
      statusMessage: t(ERROR_STATUS_KEYS[normalizedError] || "auth.uaePassUnexpectedStatus"),
      errorMessage: detailMessage || humanizeErrorCode(normalizedError),
    };
  }

  return {
    kind: "success",
    statusMessage: t("auth.loginCompleted"),
    errorMessage: "",
  };
};
