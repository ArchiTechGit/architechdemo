const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} {...BASE}>
      {children}
    </svg>
  );
}

export const IconArrowUp = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Svg>
);

export const IconArrowDown = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="m18 13-6 6-6-6" />
  </Svg>
);

export const IconArrowRight = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const IconDownload = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </Svg>
);

export const IconSearch = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const IconMail = (p: { size?: number }) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const IconChat = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M4 5h16v11H8l-4 4V5Z" />
  </Svg>
);

export const IconApps = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="6" cy="6" r="1.6" />
    <circle cx="12" cy="6" r="1.6" />
    <circle cx="18" cy="6" r="1.6" />
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="12" cy="18" r="1.6" />
    <circle cx="18" cy="18" r="1.6" />
  </Svg>
);

export const IconLogout = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M9 4H5v16h4" />
    <path d="M15 16l4-4-4-4" />
    <path d="M19 12H9" />
  </Svg>
);

export const IconChevronDown = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconTag = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M20 12 12.5 4.5H5a1 1 0 0 0-1 1v7.5L11.5 20a1 1 0 0 0 1.4 0L20 13.4a1 1 0 0 0 0-1.4Z" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconUser = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
  </Svg>
);

export const IconUsers = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="2.6" />
    <circle cx="17" cy="9" r="2.2" />
    <path d="M3.5 19c1-2.8 3.2-4.3 5.5-4.3s4.5 1.5 5.5 4.3" />
    <path d="M15.5 15c2 .2 3.6 1.5 4.3 3.6" />
  </Svg>
);

export const IconPin = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.2" />
  </Svg>
);

export const IconPhone = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M6.5 3h3l1.5 4.5-2 1.7a12 12 0 0 0 5.3 5.3l1.7-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
  </Svg>
);

export const IconClipboard = (p: { size?: number }) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <rect x="9" y="2.5" width="6" height="3" rx="1" />
    <path d="M8.5 11h7M8.5 15h7" />
  </Svg>
);

export const IconReceipt = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-2-1.3L14 21l-2-1.3L10 21l-2-1.3L6 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);

export const IconWarningTriangle = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M12 4 2 20h20L12 4Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconClock = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);

export const IconXCircle = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
  </Svg>
);

export const IconCopy = (p: { size?: number }) => (
  <Svg {...p}>
    <rect x="8" y="8" width="12" height="12" rx="1.5" />
    <path d="M5 15.5H4.5A1.5 1.5 0 0 1 3 14V4.5A1.5 1.5 0 0 1 4.5 3H14a1.5 1.5 0 0 1 1.5 1.5V5" />
  </Svg>
);

export const IconExternalLink = (p: { size?: number }) => (
  <Svg {...p}>
    <path d="M10 6H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
  </Svg>
);

export const IconInfo = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconSettings = (p: { size?: number }) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M19 12a7 7 0 0 0-.15-1.4l1.9-1.5-1.5-2.6-2.3.7a7 7 0 0 0-2.4-1.4L14 3.5h-3l-.5 2.3a7 7 0 0 0-2.4 1.4l-2.3-.7-1.5 2.6 1.9 1.5A7 7 0 0 0 5 12c0 .5.05.95.15 1.4l-1.9 1.5 1.5 2.6 2.3-.7a7 7 0 0 0 2.4 1.4l.5 2.3h3l.5-2.3a7 7 0 0 0 2.4-1.4l2.3.7 1.5-2.6-1.9-1.5c.1-.45.15-.9.15-1.4Z" />
  </Svg>
);

// Fixed decorative category icons for the Risks section, matching the
// reference screenshot's circular icon row (sun / leaf / flame / dog /
// flag / building). Purely visual, not tied to the actual risk text.
export const RISK_CATEGORY_ICON_PATHS: React.ReactNode[] = [
  <Svg key="sun"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Svg>,
  <Svg key="leaf"><path d="M20 4C10 4 4 10 4 20c8 0 16-6 16-16Z" /><path d="M6 18 18 6" /></Svg>,
  <Svg key="flame"><path d="M12 21c4 0 6-2.5 6-6 0-3-2-5-3-8-1 2-2 3-3 3-1.5 0-2-2-2-4-3 2-5 6-5 9 0 3.5 3 6 7 6Z" /></Svg>,
  <Svg key="dog"><path d="M5 10 3 6l3 1 2-2 3 1 3-1 2 2 3-1-2 4" /><path d="M7 10v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-6" /></Svg>,
  <Svg key="flag"><path d="M6 3v18" /><path d="M6 4h11l-2.5 4L17 12H6" /></Svg>,
  <Svg key="building"><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" /></Svg>,
];
