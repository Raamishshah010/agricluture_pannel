import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useTranslation from '../../hooks/useTranslation';
import { API_BASE_URL } from "../../utils";

const AUTH_BASE = "https://stg-id.uaepass.ae/idshub";
const CLIENT_ID = "sandbox_stage";
const SCOPES = [
  "urn:uae:digitalid:profile:general",
  "urn:uae:digitalid:profile:general:profileType",
  "urn:uae:digitalid:profile:general:unifiedId",
].join(" ");
const ACR_VALUES = "urn:safelayer:tws:policies:authentication:level:low";
const STATE_KEY = "uae-pass-state";

const CALLBACK_PATH = "/api/ue-pass/callback";
const REDIRECT_URI = `${API_BASE_URL}${CALLBACK_PATH}`;

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

export const UaePassLogin = () => {
  const t = useTranslation();
  const [statusMessage, setStatusMessage] = useState(t('auth.readyToStart'));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [stateMismatch, setStateMismatch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    if (!payload) return;

    try {
      const parsed = decodePayload(payload);
      const storedState = window.sessionStorage.getItem(STATE_KEY);
      if (!storedState || parsed.state !== storedState) {
        setStateMismatch(true);
        setError(t('auth.stateMismatchMessage'));
        setStatusMessage(t('auth.stateHandshakeFailed'));
        return;
      }
      setStateMismatch(false);
      setUserData(parsed.user);
      setStatusMessage("User data received from the backend redirect.");
      setError("");
    } catch (decodeError) {
      setError(t('auth.payloadDecodeFailed'));
      setStatusMessage(t('auth.payloadDecodeFailedStatus'));
    } finally {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  const handleLoginClick = () => {
    setError("");
    setStatusMessage(t('auth.preparingLogin'));
    const stateValue = generateStateValue();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STATE_KEY, stateValue);
    }
    const params = new URLSearchParams();
    params.set("response_type", "code");
    params.set("client_id", CLIENT_ID);
    params.set("scope", SCOPES);
    params.set("state", stateValue);
    params.set("redirect_uri", REDIRECT_URI);
    params.set("acr_values", ACR_VALUES);
    setLoading(true);
    window.location.href = `${AUTH_BASE}/authorize?${params.toString()}`;
  };

  const resetFlow = () => {
    setUserData(null);
    setError("");
    setStatusMessage(t('auth.readyToStart'));
    setStateMismatch(false);
    setLoading(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STATE_KEY);
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{t('auth.uaePassDemo')}</p>
          <h1 className="text-3xl font-semibold text-white">{t('auth.loginWithUaePass')}</h1>
          <p className="text-slate-300 max-w-3xl">{t('auth.uaePassDescription')}</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={handleLoginClick}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-3 text-lg font-semibold text-slate-950 transition hover:shadow-[0_10px_40px_rgba(16,185,129,0.35)] disabled:opacity-60 disabled:cursor-wait"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            <span>{t('auth.loginWithUaePass')}</span>
          </button>
          <div className="text-sm text-slate-300">
            {t('auth.redirectUri')} <span className="text-slate-50">{REDIRECT_URI}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('auth.status')}</p>
          <p className="text-sm text-slate-200">{statusMessage}</p>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {stateMismatch && (
            <p className="text-sm text-amber-300">
              {t('auth.stateMismatch')}
            </p>
          )}
        </div>

        {summaryRows.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('auth.userProfile')}</p>
                <p className="text-lg font-semibold text-white">{t('auth.retrievedAttributes')}</p>
              </div>
              <button
                onClick={resetFlow}
                className="text-sm text-emerald-400 underline-offset-4 hover:underline"
              >
                {t('auth.startOver')}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {summaryRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{row.key}</p>
                  <p className="font-semibold text-white">{row.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
