import React, { useState } from 'react';
import { CgArrowLeft } from 'react-icons/cg';
import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation';
import logo from '../../assets/logo.png'
import {Globe,ChevronDown ,CircleHelp } from "lucide-react"

export const Successfull = () => {
  const t = useTranslation();
  const [language, setLanguage] = useState('العربية');

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
        <div className='flex justify-center'><img src={logo} alt="Logo" className="mx-auto" /></div>
        <h2 className="text-3xl font-semibold mt-4">{t('auth.passwordResetSuccessful')}</h2>
        <p className="mt-2 text-gray-900 md:mb-10 mb-4">{t('auth.passwordResetSuccessDesc')}</p>
        <Link to="/">
           <button
            type="submit"
            className="w-full py-2 cursor-pointer  text-white bg-green-600 rounded-md hover:bg-green-700 transition"
          >
            {t('auth.goToLogin')}
          </button>
        </Link>
      </div>
    </div>
   
   </>
  );
};