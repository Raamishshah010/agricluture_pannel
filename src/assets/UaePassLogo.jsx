import React from 'react';
import uaePassLogo from '../assets/uae_pass_logo.png'; // adjust path

export default function UaePassLogo({ size = 40 }) {
  return (
    <img
      src={uaePassLogo}
      alt="UAE PASS"
      style={{
        width: size,
        height: size,
        objectFit: 'contain'
      }}
    />
  );
}