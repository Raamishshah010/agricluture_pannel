import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import useStore from "../store/store";
const Dropdown = ({
  options,
  value,
  onChange,
  placeholder,
  classes = "w-48",
}) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const finalPlaceholder = placeholder || t("common.components.select");
  const dropdownRef = useRef(null);
  const { language: lang } = useStore((st) => st);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  // Get display name
  const getDisplayName = () => {
    if (!value) return finalPlaceholder;

    return isLTR ? value.name : value.nameInArrabic || value.name;
  };
  const isLTR = lang.includes("en");

  return (
    <div className={`relative ${classes}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${
          isLTR ? "flex-row" : "flex-row-reverse"
        } px-2 py-1.5 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 focus:outline-none focus:border-blue-500 transition-colors`}
      >
        <span className="text-gray-900 font-medium text-md">
          {getDisplayName()}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-700 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-4 py-3 ${
                isLTR ? "text-left" : "text-right"
              } hover:bg-gray-100 transition-colors ${
                value?.id === option.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-900"
              } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === options.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              {isLTR ? option.name : option.nameInArrabic || option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
