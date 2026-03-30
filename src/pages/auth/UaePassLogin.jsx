import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTranslation from '../../hooks/useTranslation';
import { API_BASE_URL } from "../../utils";
import useStore from '../../store/store';
import logo from '../../assets/logo.png';

const STATE_KEY = "uae-pass-state";
const ENVIRONMENT_KEY = "uae-pass-environment";

const ENVIRONMENT_OPTIONS = [
  { value: "staging", labelKey: "auth.uaePassStaging" },
  { value: "production", labelKey: "auth.uaePassProduction" },
];

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

const requestAuthorizationUrl = async (environment, state) => {
  const response = await fetch(
    `${API_BASE_URL}/api/ue-pass/authorize?environment=${encodeURIComponent(environment)}&state=${encodeURIComponent(state)}`,
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

export const UaePassLogin = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const { setAdminToken } = useStore((state) => state);
  const [statusMessage, setStatusMessage] = useState(t('auth.readyToStart'));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [stateMismatch, setStateMismatch] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState(
    typeof window !== "undefined" ? window.sessionStorage.getItem(ENVIRONMENT_KEY) || "staging" : "staging"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    console.log('UAE-PASS:raw-location', window.location.href);
    if (!payload) return;

    // If a staging-admin flow started, forward the payload to the staging admin page
    try {
      const isStagingAdmin = window.sessionStorage.getItem('stagingAdmin');
      const env = window.sessionStorage.getItem(ENVIRONMENT_KEY);
      if (isStagingAdmin === 'true' || env === 'staging') {
        // clear the flag and forward the payload to the staging admin page
        window.sessionStorage.removeItem('stagingAdmin');
        const forwardUrl = `${window.location.origin}/ue-pass-staging-admin?payload=${encodeURIComponent(payload)}`;
        window.location.replace(forwardUrl);
        return;
      }
    } catch (e) {
      console.warn('Failed to forward to staging admin page', e);
    }

    try {
      const parsed = decodePayload(payload);
      console.log('UAE-PASS:decoded-payload', parsed);
      console.log('UAE-PASS:decoded-request', parsed.request);
      console.log('UAE-PASS:decoded-tokenResponse', parsed.tokenResponse);
      console.log('UAE-PASS:decoded-userResponse', parsed.userResponse);
      const storedState = window.sessionStorage.getItem(STATE_KEY);
      if (!storedState || parsed.state !== storedState) {
        setStateMismatch(true);
        setError(t('auth.stateMismatchMessage'));
        setStatusMessage(t('auth.stateHandshakeFailed'));
        return;
      }
      setStateMismatch(false);

      // normalized user payload
      const receivedUser = parsed.user || parsed.userResponse || parsed.userResponse?.user || null;
      setUserData(receivedUser);

      // Determine tokens: adminToken (for admin panel) and appToken (for app/mobile)
      const adminToken = parsed.adminToken || parsed.token || null;
      const appToken = parsed.appToken || null;

      if (adminToken) {
        window.sessionStorage.setItem("adminToken", adminToken);
        setAdminToken(adminToken);
      } else {
        // ensure adminToken cleared if present
        window.sessionStorage.removeItem('adminToken');
        setAdminToken(null);

        // Inform the user clearly that they are not an admin
        const notAdminMsg = t('auth.notAdmin') || 'You are not registered as an admin for this dashboard.';
        const notAdminStatus = t('auth.notAdminStatus') || 'Access to admin dashboard denied.';
        setError(notAdminMsg);
        setStatusMessage(notAdminStatus);
      }

      if (appToken) {
        window.sessionStorage.setItem('token', appToken);
      }

      if (parsed.environment) {
        window.sessionStorage.setItem(ENVIRONMENT_KEY, parsed.environment);
        setSelectedEnvironment(parsed.environment);
      }

      setStatusMessage(t('auth.loginCompleted'));
      setError("");

      // Navigate to dashboard only when admin token is present
      if (adminToken) {
        navigate("/dashboard", { replace: true });
      }
    } catch (decodeError) {
      console.error('UAE-PASS:payload-decode-error', decodeError);
      setError(t('auth.payloadDecodeFailed'));
      setStatusMessage(t('auth.payloadDecodeFailedStatus'));
    } finally {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  const handleLoginClick = async (environment) => {
    setError("");
    setStatusMessage(t('auth.preparingLogin'));
    setSelectedEnvironment(environment);
    const stateValue = generateStateValue();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STATE_KEY, stateValue);
      window.sessionStorage.setItem(ENVIRONMENT_KEY, environment);
    }
    setLoading(true);
    try {
      const { authorizationUrl } = await requestAuthorizationUrl(environment, stateValue);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(requestError.message);
      setStatusMessage(t('auth.readyToStart'));
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setUserData(null);
    setError("");
    setStatusMessage(t('auth.readyToStart'));
    setStateMismatch(false);
    setLoading(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STATE_KEY);
      window.sessionStorage.removeItem(ENVIRONMENT_KEY);
      setAdminToken(null);
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
      <div className="w-full max-w-3xl p-8 space-y-6 flex flex-col items-center">
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Mazraty Logo" className="h-48 w-auto object-contain" />
          </div>
          <div className="hidden">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{t('auth.uaePassLogin')}</p>
            <h1 className="text-3xl font-semibold text-white">{t('auth.loginWithUaePass')}</h1>
            <p className="text-slate-300 max-w-3xl">{t('auth.uaePassDescription')}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 hidden">
          {ENVIRONMENT_OPTIONS.map((option) => {
            const isActive = selectedEnvironment === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedEnvironment(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-emerald-400 bg-emerald-400/10 text-white shadow-[0_10px_35px_rgba(16,185,129,0.15)]"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('auth.uaePassEnvironment')}</div>
                <div className="mt-1 text-lg font-semibold">{t(option.labelKey)}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
          <button
            onClick={() => handleLoginClick('staging')}
            disabled={loading}
            className="flex items-center justify-center gap-3 rounded-full bg-black px-12 py-4 text-xl font-semibold text-white transition disabled:opacity-60 disabled:cursor-wait min-w-[340px]"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : null}
            <span>Sign in with UAE PASS</span>
          </button>
          <div className="hidden text-sm text-slate-300">
            {t('auth.redirectUri')} <span className="text-slate-50">{API_BASE_URL}/api/ue-pass/callback</span>
          </div>
        </div>

        <div className={`rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 space-y-2 ${error || stateMismatch || userData ? '' : 'hidden'}`}>
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
          <section className="space-y-3 hidden">
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
