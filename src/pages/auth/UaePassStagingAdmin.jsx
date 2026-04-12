import { Loader2, Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTranslation from '../../hooks/useTranslation';
import { API_BASE_URL } from "../../utils";
import useStore from '../../store/store';
import logo from '../../assets/logo.png';
import UaePassLogo from '../../assets/UaePassLogo';
import { getUaePassOutcome } from './uaePassFlow';

const STATE_KEY = "uae-pass-state";
const ENVIRONMENT_KEY = "uae-pass-environment";

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

export const UaePassStagingAdmin = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage, setAdminToken, setAdmin } = useStore((state) => state);
  const [statusMessage, setStatusMessage] = useState(t('auth.readyToStart'));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [stateMismatch, setStateMismatch] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    console.log('UAE-PASS-STAGING:raw-location', window.location.href);
    if (!payload) return;

    (async () => {
      try {
        const parsed = decodePayload(payload);
        console.log('UAE-PASS-STAGING:decoded-payload', parsed);
        const outcome = getUaePassOutcome(parsed, t);
        if (outcome.kind !== 'success') {
          setLoading(false);
          setUserData(null);
          setStateMismatch(false);
          setAdminToken(null);
          window.sessionStorage.removeItem('adminToken');
          setError(outcome.statusMessage);
          setStatusMessage('');
          return;
        }

        const storedState = window.sessionStorage.getItem(STATE_KEY);
        if (!storedState || parsed.state !== storedState) {
          setStateMismatch(false);
          setError(t('auth.stateMismatchMessage'));
          setStatusMessage('');
          return;
        }
        setStateMismatch(false);

        const receivedUser = parsed.user || parsed.userResponse || null;
        setUserData(receivedUser);

        // If admin token present, behave like normal admin login
        const adminToken = parsed.adminToken || parsed.token || null;
        if (adminToken) {
          window.sessionStorage.setItem("adminToken", adminToken);
          setAdminToken(adminToken);
          setStatusMessage(t('auth.loginCompleted'));
          setError('');
          navigate('/dashboard', { replace: true });
          return;
        }

        // No admin token: attempt to create admin via backend API
        setStatusMessage(t('auth.creatingAdminAccount'));
        console.log('UAE-PASS-STAGING: sending create-admin payload', receivedUser);
        const resp = await fetch(`${API_BASE_URL}/api/admin/create-from-uaepass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receivedUser)
        });
        let body;
        try {
          body = await resp.json();
        } catch (e) {
          const text = await resp.text();
          console.error('UAE-PASS-STAGING: non-json response', text);
          throw new Error('Invalid response from server');
        }
        console.log('UAE-PASS-STAGING: create-admin response', resp.status, body);
        if (!resp.ok || !body.success) {
          throw new Error(body.message || 'Failed to create admin');
        }

        const token = body.token || null;
        if (token) {
          window.sessionStorage.setItem('adminToken', token);
          setAdminToken(token);
          if (body.admin) setAdmin(body.admin);
          setStatusMessage(t('auth.adminCreatedAndSignedIn'));
          setError('');
          navigate('/dashboard', { replace: true });
          return;
        }

        throw new Error('Admin created but no token returned');
      } catch (err) {
        console.error('UAE-PASS-STAGING:error', err);
        setError(err.message || String(err));
        setStatusMessage('');
      } finally {
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, "", cleanUrl);
      }
    })();
  }, []);

  const startLogin = async () => {
    setError("");
    setStatusMessage(t('auth.preparingLogin'));
    const stateValue = generateStateValue();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STATE_KEY, stateValue);
      window.sessionStorage.setItem(ENVIRONMENT_KEY, 'staging');
      window.sessionStorage.setItem('stagingAdmin', 'true');
    }
    setLoading(true);
    try {
      const { authorizationUrl } = await requestAuthorizationUrl('staging', stateValue, language);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setError(requestError.message || t('auth.uaePassAuthorizationFailedDetail'));
      setStatusMessage('');
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
        <div className="w-full flex justify-end">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-fit shadow-sm space-x-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border-none bg-transparent text-gray-800 font-semibold focus:outline-none rounded-md cursor-pointer"
              aria-label={t('auth.language')}
            >
              <option value="en">{t('auth.english')}</option>
              <option value="ar">{t('auth.arabic')}</option>
            </select>
            <Globe className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Mazraty Logo" className="h-48 w-auto object-contain" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
          <button
            onClick={startLogin}
            disabled={loading}
            className="flex w-full max-w-full items-center justify-center gap-2 rounded-full border border-1 border-black bg-white px-4 py-3 text-center text-sm font-semibold text-black shadow transition-all duration-200 ease-out transform-gpu hover:-translate-y-1 hover:shadow-lg active:scale-95 active:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto sm:max-w-[420px] sm:gap-3 sm:px-8 sm:py-4 sm:text-base md:text-lg"
            aria-label={`${t('auth.loginWithUaePass')} (${t('auth.uaePassStaging')})`}
          >
            <UaePassLogo className="h-6 w-6 shrink-0" variant="onDark" />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            </span>
            <span className="whitespace-nowrap leading-none">{`${t('auth.loginWithUaePass')} (${t('auth.uaePassStaging')})`}</span>
          </button>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

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

export default UaePassStagingAdmin;
