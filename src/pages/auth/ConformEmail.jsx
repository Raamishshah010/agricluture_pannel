import React from 'react';
import { CgArrowLeft } from 'react-icons/cg';
import {Globe,ChevronDown ,CircleHelp } from "lucide-react"

import logo from '../../assets/logo.png'
import { Link } from 'react-router-dom';
export const Conform = () => {
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
               <div className="flex flex-col items-center ">
                 <img
                   src={logo} 
                   alt="Mazraty Logo"
                   className="w-20 h-20 "
                 />
                 <h1 className="text-3xl md:my-8  my-4 font-semibold text-gray-800">Check Your Email</h1>
               </div>
        <p className="mt-2 text-gray-900 md:mb-8 mb-4">
            We have sent a confirmation link to your email address. Please check your inbox [ and spam/junk folder ] to proceed
        </p>
        <div className='flex flex-col gap-4 w-full justify-center items-center'>
           {/* <div> */}
           <Link to="/">
            <div className='flex gap-1 text-green-600 p-2 cursor-pointer  rounded-md justify-center w-full hover:bg-green-100 hover:border-1 border-gray-700 '>
            <CgArrowLeft className='text-3xl mt-2'/>
            <button className="text-xl text-green-700  cursor-pointer">
            Return to login
          </button>
           {/* </div> */}
           </div>
           </Link>
        </div>
        <div>
            <p className=" text-gray-900 md:mb-10 mt-6">
                Didn't receive the email?<a href="#" className="text-green-700">resend link</a>.
            </p>
        </div>
      </div>
    </div>
   </>
  );
};