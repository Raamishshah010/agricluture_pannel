import { Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useTranslation from "../../hooks/useTranslation";
import { API_BASE_URL } from "../../utils";
import useStore from "../../store/store";
import logo from "../../assets/logo.png";
import UaePassLogo from "../../assets/UaePassLogo";
import { getUaePassOutcome } from "./uaePassFlow";

const STATE_KEY = "uae-pass-state";
const ENVIRONMENT_KEY = "uae-pass-environment";
const TESTING_FLOW_KEY = "uae-pass-testing-flow";

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const formatKey = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((segment) =>
      segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : ""
    )
    .join(" ");

const generateStateValue = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const decodePayload = (encoded) => {
  if (!encoded) {
    throw new Error("Missing payload");
  }
  if (typeof window === "undefined") {
    throw new Error("Payload decoding must run in the browser");
  }
  const normalized = decodeURIComponent(encoded);
  return JSON.parse(window.atob(normalized));
};

const requestAuthorizationUrl = async (environment, state, language) => {
  const params = new URLSearchParams({
    environment,
    state,
  });

  if (language === "ar") {
    params.set("ui_locales", "ar");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/ue-pass/authorize?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to prepare UAE Pass authorization");
  }

  return data;
};

export const TestingUaePass = () => {
  const t = useTranslation();
  const { language, setLanguage } = useStore((state) => state);
  const [statusMessage, setStatusMessage] = useState(t("auth.readyToStart"));
  const [loading, setLoading] = useState(false);
  const [parsedPayload, setParsedPayload] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    if (!payload) return;

    try {
      const parsed = decodePayload(payload);
      setParsedPayload(parsed);

      const outcome = getUaePassOutcome(parsed, t);
      if (outcome.kind !== "success") {
        setLoading(false);
        setUserData(null);
        setError(outcome.statusMessage);
        setStatusMessage("");
        return;
      }

      const storedState = window.sessionStorage.getItem(STATE_KEY);
      if (!storedState || parsed.state !== storedState) {
        setError(t("auth.stateMismatchMessage"));
        setStatusMessage("");
        return;
      }

      const receivedUser = parsed.user || parsed.userResponse || parsed.userResponse?.user || null;
      setUserData(receivedUser);
      setStatusMessage(t("auth.loginCompleted"));
      setError("");
    } catch (decodeError) {
      console.error("UAE-PASS-TEST:payload-decode-error", decodeError);
      setError(t("auth.payloadDecodeFailed"));
      setStatusMessage("");
      setLoading(false);
    } finally {
      window.sessionStorage.removeItem(TESTING_FLOW_KEY);
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [t]);

  const handleLoginClick = async () => {
    setError("");
    setStatusMessage(t("auth.preparingLogin"));
    const stateValue = generateStateValue();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STATE_KEY, stateValue);
      window.sessionStorage.setItem(ENVIRONMENT_KEY, "staging");
      window.sessionStorage.setItem(TESTING_FLOW_KEY, "true");
    }
    setLoading(true);
    try {
      const { authorizationUrl } = await requestAuthorizationUrl("staging", stateValue, language);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(requestError.message || t("auth.uaePassAuthorizationFailedDetail"));
      setStatusMessage("");
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setParsedPayload(null);
    setUserData(null);
    setError("");
    setStatusMessage(t("auth.readyToStart"));
    setLoading(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STATE_KEY);
      window.sessionStorage.removeItem(ENVIRONMENT_KEY);
      window.sessionStorage.removeItem(TESTING_FLOW_KEY);
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  };

  const summaryRows = useMemo(() => {
    if (!userData) return [];
    return Object.entries(userData).map(([key, value]) => ({
      key: formatKey(key),
      value: formatValue(value),
    }));
  }, [userData]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl p-8 space-y-6 flex flex-col items-center">
        <div className="w-full flex justify-end">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-fit shadow-sm space-x-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border-none bg-transparent text-gray-800 font-semibold focus:outline-none rounded-md cursor-pointer"
              aria-label={t("auth.language")}
            >
              <option value="en">{t("auth.english")}</option>
              <option value="ar">{t("auth.arabic")}</option>
            </select>
            <Globe className="w-4 h-4 text-gray-700" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <img src={logo} alt="Mazraty Logo" className="h-32 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">UAE Pass Testing Login</h1>
          <p className="text-sm text-gray-600">Runs UAE Pass login and prints returned response data on this page.</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
          <button
            onClick={handleLoginClick}
            disabled={loading}
            className="relative inline-flex min-h-[48px] min-w-[140px] w-full max-w-[520px] cursor-pointer items-center justify-center rounded-[12px] border border-black bg-black px-5 py-2.5 text-center text-base font-semibold leading-none text-white transition-all duration-150 hover:bg-neutral-900 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 active:bg-neutral-800 active:shadow-[0_2px_8px_rgba(0,0,0,0.2)] md:min-h-[56px] md:max-w-[640px] md:px-8 md:py-3 md:text-lg lg:min-h-[60px] lg:text-xl disabled:cursor-not-allowed disabled:border-neutral-500 disabled:bg-neutral-600 disabled:text-neutral-200 disabled:shadow-none"
            aria-label={`${t("auth.loginWithUaePass")} (${t("auth.uaePassStaging")})`}
          >
            <span className="inline-flex items-center justify-center gap-3 md:gap-4">
              <UaePassLogo className="h-6 w-6 shrink-0 md:h-7 md:w-7" size={24} />
              <span className="whitespace-nowrap leading-none">{`${t("auth.loginWithUaePass")} (${t("auth.uaePassStaging")})`}</span>
            </span>
          </button>

          {(summaryRows.length > 0 || parsedPayload) && (
            <button
              onClick={resetFlow}
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("auth.startOver")}
            </button>
          )}
        </div>

        {statusMessage && <p className="text-sm font-medium text-emerald-700">{statusMessage}</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {summaryRows.length > 0 && (
          <section className="w-full space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">User Data</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {summaryRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{row.key}</p>
                  <pre className="mt-2 whitespace-pre-wrap break-all text-sm font-medium text-gray-900">{row.value}</pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {parsedPayload && (
          <section className="w-full space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Full Callback Payload</h2>
            <pre className="max-h-[420px] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-800">
              {JSON.stringify(parsedPayload, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
};

export default TestingUaePass;