import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Globe, ChevronDown, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import adminService from "../../services/adminService";
import useTranslation from "../../hooks/useTranslation";
import useStore from "../../store/store";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { language } = useStore((state) => state);
  const t = useTranslation();

  const navigate = useNavigate();
  const emailRegex =
    /^[\w-.]+@([\w-]+\.)+(com|net|org|edu|gov|mil|info|io|co)$/i;

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!email) {
      newErrors.email = "Please enter your email";
    } else if (!emailRegex.test(email)) {
      newErrors.emailFormat = "Please enter a valid email address";
    } else {
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain) {
        if (/\.[a-z]{2,}\1$/i.test(domain)) {
          newErrors.emailFormat = "Please enter a valid email address";
        }
        if (domain.startsWith("gmaill.")) {
          newErrors.emailFormat = "Did you mean gmail.com?";
        }
      }
    }
    if (!password) newErrors.password = "Please enter your password";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const res = await adminService.login({ email, password });
        sessionStorage.setItem("adminToken", res.token);
        navigate("/dashboard");
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  return (
    <>
      <div className="flex py-5 pr-8 justify-end">
        <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
          <CircleHelp className="w-5 mr-6 mt-2 h-5" />
          <ChevronDown className="w-5 mt-2 h-5" />

          <span>{language}</span>
          <Globe className="w-5 h-5 mt-1" />
        </button>
      </div>
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-md p-6">
          {/* Logo */}
          <div className="flex flex-col items-center ">
            <img
              src={logo}
              alt="Mazraty Logo"
              className="h-[100px] w-auto object-contain"
            />
            <h1 className="text-3xl my-10 font-semibold text-gray-800">
              {t("auth.welcomeBack")}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <input
                //   type="email"
                placeholder={t("auth.emailAddress")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  errors.email || errors.emailFormat
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:ring-1 focus:ring-green-500"
                }`}
              />
              {/* Show field error (red border) only for empty field */}
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 text-end">
                  {errors.email}
                </p>
              )}
              {/* Show regex error as red text, but do not apply red border */}
              {errors.emailFormat && !errors.email && (
                <p className="text-red-500 text-sm mt-1 text-end">
                  {errors.emailFormat}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("admin.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                    errors.password
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-300 focus:ring-1 focus:ring-green-500"
                  }`}
                />
                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </span>
              </div>
              {errors.password && (
                <p className="text-red-500 text-end text-sm mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me + Forget Password */}
            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox text-green-500"
                />
                <span className="text-gray-700">{t("auth.rememberMe")}</span>
              </label>
              <Link to="/forgot" className="text-green-600 hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            {/* Login Button */}
            {/* <Link to="/dashboard"> */}
            <button
              type="submit"
              className="w-full py-2 cursor-pointer  text-white bg-green-600 rounded-md hover:bg-green-700 transition"
            >
              {t("auth.login")}
            </button>
            {/* </Link> */}
          </form>
        </div>
      </div>
    </>
  );
};
