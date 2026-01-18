import React, { useState } from 'react';
import { CgArrowLeft, CgArrowRight } from 'react-icons/cg';
import {Globe,ChevronDown ,CircleHelp } from "lucide-react"

import logo from '../../assets/logo.png'
import { Link, useNavigate } from 'react-router-dom';
export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const navigate = useNavigate();
    const [language, setLanguage] = useState('العربية');


  const handleSend = () => {
    if (!email) {
      setError("Please enter your email address.");
    } else if (!emailRegex.test(email)) {
      setError("Please enter a correct email address.");
    } else {
      setError("");
      // ...send reset link logic...
      navigate("/reset-password");
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
    <div className="flex md:max-w-[400px] mx-auto items-center justify-center min-h-screen bg-white">
      <div className="text-center">
         <div className="flex flex-col items-center ">
                 <img
                               src={logo}
                               alt="Mazraty Logo"
                               className="h-[100px] w-auto object-contain"
                             />
                 <h1 className="text-3xl mb-4 mt-10 font-semibold text-gray-800">Forgot Passwaord</h1>
               </div>
        <p className="mt-2 text-gray-900 md:mb-10 mb-4">Enter the email associated with your account, and we'll send you a link to reset your password.</p>
        <div className='flex flex-col gap-4 w-full justify-center items-center'>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="p-2 border rounded-md w-full md:max-w-[400px]"
          />
          {/* Error message directly below input */}
          {error && (
            <p className="text-red-500 text-sm mt-1 text-end w-full md:max-w-[400px]">{error}</p>
          )}
          <button
            className="bg-green-700 cursor-pointer text-white p-2 rounded-md w-full md:max-w-[400px]"
            type="button"
            onClick={handleSend}
          >
            Send reset link
          </button>
       
          <div>
            <Link to="/">
              <div className='flex gap-1 text-green-600 p-2 cursor-pointer  rounded-md justify-center w-full hover:bg-gray-50 hover:border-1 border-gray-700 '>
                <CgArrowLeft className='text-3xl mt-2'/>
                <button className="text-xl text-green-700  cursor-pointer">
                  Return to login
                </button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
 </>
  );
};