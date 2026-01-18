import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link } from "react-router-dom";
import logo from '../../assets/logo.png'
import {Globe,ChevronDown ,CircleHelp } from "lucide-react"

export const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [language, setLanguage] = useState('العربية');

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = "Please enter a new password";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match, Please try again";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Password Reset Submitted:", { newPassword, confirmPassword });
    }
  };

  return (
    <>
     <div className="flex py-5 pr-8 justify-end">
      <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                   <CircleHelp  className="w-5 mr-6 mt-2 h-5" />
                    <ChevronDown className="w-5 mt-2 h-5" />
                   
                    <span>{language}</span>
                    <Globe className="w-5 h-5 mt-1" /> 
                  </button>
   </div>
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="Mazraty Logo"
            className="w-20 h-20 mb-2"
          />
          <h1 className="text-4xl my-8 font-semibold text-gray-800">Reset Your Password</h1>
          <p className="text-center mb-4 text-gray-800 text-md">Create a new password for your <br /> account.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  errors.newPassword
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:ring-1 focus:ring-green-500"
                }`}
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </span>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="mb-4">
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:ring-1 focus:ring-green-500"
                }`}
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </span>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Login Button */}
       <Link to="/">
           <button
             type="submit"
             className="w-full py-2 cursor-pointer text-white bg-green-600 rounded-md hover:bg-green-700 transition"
           >
             Save Password
           </button>
       </Link>
        </form>
      </div>
    </div>
    </>
  );
};