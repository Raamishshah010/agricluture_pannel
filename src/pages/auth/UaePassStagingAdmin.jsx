import { Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useTranslation from '../../hooks/useTranslation';
import { API_BASE_URL } from "../../utils";
import useStore from '../../store/store';
import logo from '../../assets/logo.png';
import uaePassButtonDefault from '../../assets/uae-pass-button/uae-pass-button-active.svg';
import uaePassButtonPressed from '../../assets/uae-pass-button/uae-pass-button-pressed.svg';
import uaePassButtonFocus from '../../assets/uae-pass-button/uae-pass-button-focus.svg';
import uaePassButtonDisabled from '../../assets/uae-pass-button/uae-pass-button-disabled.svg';
import uaePassButtonDefaultAr from '../../assets/uae-pass-button/ar/uae-pass-button-active.svg';
import uaePassButtonPressedAr from '../../assets/uae-pass-button/ar/uae-pass-button-pressed.svg';
import uaePassButtonFocusAr from '../../assets/uae-pass-button/ar/uae-pass-button-focus.svg';
import uaePassButtonDisabledAr from '../../assets/uae-pass-button/ar/uae-pass-button-disabled.svg';
import { getUaePassOutcome } from './uaePassFlow';

const STATE_KEY = "uae-pass-state";
const ENVIRONMENT_KEY = "uae-pass-environment";
const INVITE_TOKEN_KEY = "admin-invite-token";
const INVITE_CODE_KEY = "admin-invite-code";

const UAE_PASS_BUTTON_ASSETS = {
  en: {
    default: uaePassButtonDefault,
    pressed: uaePassButtonPressed,
    focus: uaePassButtonFocus,
    disabled: uaePassButtonDisabled,
  },
  ar: {
    default: uaePassButtonDefaultAr,
    pressed: uaePassButtonPressedAr,
    focus: uaePassButtonFocusAr,
    disabled: uaePassButtonDisabledAr,
  },
};

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
  const buttonAssets = UAE_PASS_BUTTON_ASSETS[language] || UAE_PASS_BUTTON_ASSETS.en;
  const [statusMessage, setStatusMessage] = useState(t('auth.readyToStart'));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [stateMismatch, setStateMismatch] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    const queryInviteToken = params.get("inviteToken");
    const queryInviteCode = params.get("inviteCode");
    const storedInviteToken = window.sessionStorage.getItem(INVITE_TOKEN_KEY) || "";
    const storedInviteCode = window.sessionStorage.getItem(INVITE_CODE_KEY) || "";
    if (queryInviteToken) {
      window.sessionStorage.setItem(INVITE_TOKEN_KEY, queryInviteToken);
      setInviteToken(queryInviteToken);
      if (queryInviteCode) {
        window.sessionStorage.setItem(INVITE_CODE_KEY, queryInviteCode);
        setInviteCode(queryInviteCode);
      }
    } else if (storedInviteToken) {
      setInviteToken(storedInviteToken);
      if (storedInviteCode) {
        setInviteCode(storedInviteCode);
      }
    } else if (!payload) {
      setError(t('auth.inviteCodeRequired'));
      setStatusMessage('');
    }
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
          setError(t('auth.uaePassLoginExceptionStatus'));
          setStatusMessage('');
          return;
        }
        setStateMismatch(false);

        const receivedUser = parsed.user || parsed.userResponse || null;
        setUserData(receivedUser);

        const activeInviteToken = window.sessionStorage.getItem(INVITE_TOKEN_KEY) || inviteToken;
        if (!activeInviteToken) {
          setError(t('auth.inviteCodeRequired'));
          setStatusMessage('');
          return;
        }

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
          body: JSON.stringify({
            ...receivedUser,
            inviteToken: activeInviteToken,
          })
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
        setError(t('auth.uaePassLoginExceptionStatus'));
        setStatusMessage('');
      } finally {
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, "", cleanUrl);
      }
    })();
  }, []);

  async function startLogin() {
    setError("");
    const activeInviteToken = typeof window !== "undefined"
      ? (window.sessionStorage.getItem(INVITE_TOKEN_KEY) || inviteToken)
      : inviteToken;
    if (!activeInviteToken) {
      setStatusMessage('');
      setError(t('auth.inviteCodeRequired'));
      return;
    }
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
    } catch {
      setError(t('auth.uaePassLoginExceptionStatus'));
      setStatusMessage('');
      setLoading(false);
    }
  }

  const resetFlow = () => {
    setUserData(null);
    setError("");
    setStatusMessage(t('auth.readyToStart'));
    setStateMismatch(false);
    setLoading(false);
    setInviteCode('');
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STATE_KEY);
      window.sessionStorage.removeItem(ENVIRONMENT_KEY);
      window.sessionStorage.removeItem(INVITE_TOKEN_KEY);
      window.sessionStorage.removeItem(INVITE_CODE_KEY);
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
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border-none bg-transparent text-gray-800 font-semibold focus:outline-none rounded-md cursor-pointer"
          aria-label={t('auth.language')}
        >
          <option value="en">{t('auth.english')}</option>
          <option value="ar">{t('auth.arabic')}</option>
        </select>
        <Globe className="h-4 w-4 text-gray-700" />
      </div>

      <div className="w-full max-w-3xl p-8 space-y-6 flex flex-col items-center">
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Mazraty Logo" className="h-48 w-auto object-contain" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
          <button
            type="button"
            onClick={startLogin}
            disabled={loading || !inviteToken}
            className="group relative inline-flex w-full max-w-[264px] cursor-pointer items-center justify-center bg-transparent p-0 align-middle leading-none focus-visible:outline-none disabled:cursor-not-allowed"
            aria-label={t('auth.loginWithUaePass')}
            aria-busy={loading}
          >
            <span className="relative block w-full">
              <img
                src={buttonAssets.default}
                alt=""
                className="block h-auto w-full select-none"
                draggable="false"
              />
              <img
                src={buttonAssets.focus}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100"
                draggable="false"
              />
              <img
                src={buttonAssets.pressed}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0 transition-opacity duration-75 group-active:opacity-100"
                draggable="false"
              />
              {loading && (
                <img
                  src={buttonAssets.disabled}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full select-none"
                  draggable="false"
                />
              )}
            </span>
          </button>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {inviteToken && (
          <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">{t('auth.inviteCodeReady')}</p>
            <p className="mt-1 break-all">{t('auth.inviteCodeLabel')}: {inviteCode || inviteToken}</p>
          </div>
        )}

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
