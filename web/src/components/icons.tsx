// Inline SVG icons (no emoji as structural icons). Consistent 1.75 stroke,
// currentColor, 24px default. Size via the `size` prop.
import type { SVGProps, ReactNode } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconBuyer = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </Base>
);

export const IconEscrow = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15" r="1.4" />
  </Base>
);

export const IconSeller = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 9l1-4h14l1 4" />
    <path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    <path d="M5 10v9h14v-9" />
    <path d="M10 19v-4h4v4" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconRefund = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 8h11a5 5 0 0 1 0 10H8" />
    <path d="M7 4 3 8l4 4" />
  </Base>
);

export const IconWallet = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H3z" />
    <path d="M3 9v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4H15a2 2 0 0 1 0-4h6" />
    <circle cx="16" cy="13" r="1" />
  </Base>
);

export const IconRefresh = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 4v5h-5" />
  </Base>
);

export const IconCopy = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </Base>
);

export const IconExternal = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Base>
);

export const IconBolt = (p: IconProps) => (
  <Base {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </Base>
);

export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);

export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </Base>
);
