import React from 'react';
import uaePassLogo from './uae_pass_logo_white.png';

export default function UaePassLogo({ size = 24, className = '', alt = 'UAE PASS', ...props }) {
  const style = { width: size, height: size, objectFit: 'contain' };
  return (
    <img
      src={uaePassLogo}
      alt={alt}
      className={className}
      style={style}
      {...props}
    />
  );
}