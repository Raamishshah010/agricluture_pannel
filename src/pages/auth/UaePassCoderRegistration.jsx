import { Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useTranslation from '../../hooks/useTranslation';
import { API_BASE_URL } from "../../utils";
import useStore from '../../store/store';
import farmerService from '../../services/farmerService';
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
const INVITE_TOKEN_KEY = "coder-invite-token";
const INVITE_CODE_KEY = "coder-invite-code";
const CODER_FLOW_KEY = "coderRegistration";

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
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const formatKey = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((segment) => segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "")
    .join(" ");

const generateStateValue = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const decodePayload = (encoded) => {
  if (!encoded) throw new Error("Missing payload");
  if (typeof window === "undefined") throw new Error("Payload decoding must run in the browser");
  const normalized = decodeURIComponent(encoded);
  return JSON.parse(window.atob(normalized));
};

const requestAuthorizationUrl = async (environment, state, language) => {
  const params = new URLSearchParams({ environment, state });
  if (language === "ar") params.set("ui_locales", "ar");

  const response = await fetch(`${API_BASE_URL}/api/ue-pass/authorize?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to prepare UAE Pass authorization");
  }

  return data;
};

export default function UaePassCoderRegistration() {
  const t = useTranslation();
  const { language, setLanguage } = useStore((state) => state);
  const buttonAssets = UAE_PASS_BUTTON_ASSETS[language] || UAE_PASS_BUTTON_ASSETS.en;
  const [statusMessage, setStatusMessage] = useState(t('auth.readyToStart'));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [registeredCoder, setRegisteredCoder] = useState(null);

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
      if (storedInviteCode) setInviteCode(storedInviteCode);
    } else if (!payload) {
      setError('A valid coder invitation link is required to complete this signup.');
      setStatusMessage('');
    }

    if (!payload) return;

    (async () => {
      try {
        const parsed = decodePayload(payload);
        const outcome = getUaePassOutcome(parsed, t);
        if (outcome.kind !== 'success') {
          setLoading(false);
          setUserData(null);
          setError(outcome.statusMessage);
          setStatusMessage('');
          return;
        }

        const storedState = window.sessionStorage.getItem(STATE_KEY);
        if (!storedState || parsed.state !== storedState) {
          setError(t('auth.uaePassLoginExceptionStatus'));
          setStatusMessage('');
          return;
        }

        const receivedUser = parsed.user || parsed.userResponse || null;
        setUserData(receivedUser);

        const activeInviteToken = window.sessionStorage.getItem(INVITE_TOKEN_KEY) || inviteToken;
        if (!activeInviteToken) {
          setError('A valid coder invitation link is required to complete this signup.');
          setStatusMessage('');
          return;
        }

        setStatusMessage('Creating coder account...');
        const response = await farmerService.createCoderFromUaePass({
          ...receivedUser,
          inviteToken: activeInviteToken,
        });

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create coder');
        }

        const coder = response?.data?.coder || response?.data?.farmer || null;
        const token = response?.data?.token || null;
        if (token) window.sessionStorage.setItem('token', token);
        if (coder) window.sessionStorage.setItem('user', JSON.stringify(coder));

        setRegisteredCoder(coder);
        setStatusMessage('Coder registered successfully.');
        setError('');
      } catch (err) {
        setError(err?.response?.data?.message || err.message || t('auth.uaePassLoginExceptionStatus'));
        setStatusMessage('');
      } finally {
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, "", cleanUrl);
        window.sessionStorage.removeItem(CODER_FLOW_KEY);
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
      setError('A valid coder invitation link is required to complete this signup.');
      return;
    }

    setStatusMessage(t('auth.preparingLogin'));
    const stateValue = generateStateValue();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STATE_KEY, stateValue);
      window.sessionStorage.setItem(ENVIRONMENT_KEY, 'staging');
      window.sessionStorage.setItem(CODER_FLOW_KEY, 'true');
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
    setRegisteredCoder(null);
    setError("");
    setStatusMessage(t('auth.readyToStart'));
    setLoading(false);
    setInviteCode('');
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STATE_KEY);
      window.sessionStorage.removeItem(ENVIRONMENT_KEY);
      window.sessionStorage.removeItem(INVITE_TOKEN_KEY);
      window.sessionStorage.removeItem(INVITE_CODE_KEY);
      window.sessionStorage.removeItem(CODER_FLOW_KEY);
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
        <img src={logo} alt="Mazraty Logo" className="h-48 w-auto object-contain" />

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Coder Registration</h1>
          {inviteCode && <p className="mt-2 text-sm text-gray-600">Invitation code: {inviteCode}</p>}
        </div>

        {!registeredCoder && (
          <button
            type="button"
            onClick={startLogin}
            disabled={loading || !inviteToken}
            className="group relative inline-flex w-full max-w-[264px] cursor-pointer items-center justify-center bg-transparent p-0 align-middle leading-none focus-visible:outline-none disabled:cursor-not-allowed"
            aria-label={t('auth.loginWithUaePass')}
            aria-busy={loading}
          >
            <span className="relative block w-full">
              <img src={buttonAssets.default} alt="" className="block h-auto w-full select-none" draggable="false" />
              <img src={buttonAssets.focus} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100" draggable="false" />
              <img src={buttonAssets.pressed} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-0 transition-opacity duration-75 group-active:opacity-100" draggable="false" />
              {loading && <img src={buttonAssets.disabled} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none" draggable="false" />}
            </span>
          </button>
        )}

        {statusMessage && (
          <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {registeredCoder && (
          <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Account ready</p>
            <p className="mt-1 text-sm text-gray-600">{registeredCoder.fullnameEN || registeredCoder.email}</p>
          </div>
        )}

        {summaryRows.length > 0 && (
          <div className="w-full overflow-hidden rounded-lg border border-gray-200">
            {summaryRows.slice(0, 8).map((row) => (
              <div key={row.key} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">{row.key}</div>
                <div className="col-span-2 break-words px-3 py-2 text-xs text-gray-900">{row.value}</div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={resetFlow}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
