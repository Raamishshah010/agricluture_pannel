import React from 'react';
import uaePassLogo from './uae_pass_logo_white.png';

export default function UaePassLogo({ size = 24, className = '', alt = 'UAE PASS', variant, ...props }) {
  return (
    <img
      src={uaePassLogo}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      {...props}
    />
  );
}