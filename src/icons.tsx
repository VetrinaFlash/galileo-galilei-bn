import type { ServiceIcon } from "./content";
import { realLogo } from "./photos";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const paths: Record<ServiceIcon, JSX.Element> = {
  wifi: <><path d="M3 9.5a14 14 0 0 1 18 0" {...P} /><path d="M6 13a9.5 9.5 0 0 1 12 0" {...P} /><path d="M9 16.5a5 5 0 0 1 6 0" {...P} /><circle cx="12" cy="19.5" r="1" fill="currentColor" /></>,
  ac: <><rect x="3" y="5" width="18" height="8" rx="2" {...P} /><path d="M7 10h10M8 16l-1 3M12 16v3M16 16l1 3" {...P} /></>,
  shower: <><path d="M5 20V8a4 4 0 0 1 8 0" {...P} /><path d="M10 11h6" {...P} /><path d="M12 14v1M15 14v1M18 14v1M13.5 17v1M16.5 17v1" {...P} /></>,
  tv: <><rect x="3" y="5" width="18" height="12" rx="2" {...P} /><path d="M8 20h8" {...P} /></>,
  coffee: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" {...P} /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3" {...P} /></>,
  terrace: <><path d="M3 11h18M5 11v9M19 11v9M9 11v9M15 11v9M3 20h18" {...P} /><path d="M12 3l9 5H3z" {...P} /></>,
  garden: <><path d="M12 21v-8" {...P} /><path d="M12 13c-4 0-6-3-6-7 4 0 6 3 6 7zM12 13c4 0 6-3 6-7-4 0-6 3-6 7z" {...P} /><path d="M6 21h12" {...P} /></>,
  lounge: <><path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" {...P} /><path d="M3 12h18v5H3zM5 17v2M19 17v2" {...P} /></>,
  parking: <><rect x="4" y="3" width="16" height="18" rx="3" {...P} /><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" {...P} /></>,
  pet: <><circle cx="7" cy="9" r="1.6" {...P} /><circle cx="17" cy="9" r="1.6" {...P} /><circle cx="10" cy="5.5" r="1.6" {...P} /><circle cx="14" cy="5.5" r="1.6" {...P} /><path d="M12 12c-3 0-5 3.5-5 5.5S9 20 12 19s5 .5 5-1.5-2-5.5-5-5.5z" {...P} /></>,
};

export const ServiceSvg = ({ name }: { name: ServiceIcon }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">{paths[name]}</svg>
);

export const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z" />
  </svg>
);

export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...P} /></svg>
);

export const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" {...P} /><circle cx="12" cy="9.5" r="2.5" {...P} /></svg>
);

/** Logo: monogramma con stella (omaggio a Galileo). Sostituibile con il logo vero in /public/logo.svg */
export const Logo = ({ size = 40 }: { size?: number }) => realLogo ? (
  <img src={realLogo} alt="" width={size} height={size} style={{ objectFit: "contain", width: size, height: size }} />
) : (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".6" />
    <text x="24" y="29.5" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="17" fontWeight="600" fill="currentColor" letterSpacing="-.5">GG</text>
    <path d="M24 6.2l1 2.6 2.7.2-2.1 1.7.7 2.6-2.3-1.5-2.3 1.5.7-2.6-2.1-1.7 2.7-.2z" fill="currentColor" />
  </svg>
);
