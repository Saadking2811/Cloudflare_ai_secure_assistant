// ── Clean SVG Icon System ──
// Monochrome, professional icons — no emojis

interface IconProps {
  size?: number;
  className?: string;
}

function icon(path: string, viewBox = "0 0 24 24") {
  return function SvgIcon({ size = 18, className = "" }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    );
  };
}

function multiPath(paths: string[], fills?: boolean[]) {
  return function SvgIcon({ size = 18, className = "" }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} fill={fills?.[i] ? "currentColor" : "none"} />
        ))}
      </svg>
    );
  };
}

// Shield
export const ShieldIcon = multiPath([
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
]);

// Chat / Message
export const ChatIcon = multiPath([
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
]);

// Dashboard / Grid
export const DashboardIcon = multiPath([
  "M3 3h7v7H3z",
  "M14 3h7v7h-7z",
  "M14 14h7v7h-7z",
  "M3 14h7v7H3z",
]);

// Activity / Chart
export const ActivityIcon = icon(
  "M22 12h-4l-3 9L9 3l-3 9H2"
);

// Alert Triangle
export const AlertIcon = multiPath([
  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  "M12 9v4",
  "M12 17h.01",
]);

// Target / Crosshair
export const TargetIcon = multiPath([
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
  "M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
]);

// Search / Magnifier
export const SearchIcon = multiPath([
  "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  "M21 21l-4.35-4.35",
]);

// Zap / Bolt
export const ZapIcon = icon(
  "M13 2L3 14h9l-1 10 10-12h-9l1-10z"
);

// User
export const UserIcon = multiPath([
  "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
  "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
]);

// Send / Arrow
export const SendIcon = multiPath([
  "M22 2L11 13",
  "M22 2L15 22L11 13L2 9L22 2Z",
]);

// Check
export const CheckIcon = icon(
  "M20 6L9 17l-5-5"
);

// Clock
export const ClockIcon = multiPath([
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  "M12 6v6l4 2",
]);

// Globe / Network
export const GlobeIcon = multiPath([
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  "M2 12h20",
  "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
]);

// Bar Chart
export const BarChartIcon = multiPath([
  "M12 20V10",
  "M18 20V4",
  "M6 20v-4",
]);

// Eye
export const EyeIcon = multiPath([
  "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
]);

// Lock
export const LockIcon = multiPath([
  "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z",
  "M7 11V7a5 5 0 0 1 10 0v4",
]);

// Layers
export const LayersIcon = multiPath([
  "M12 2L2 7l10 5 10-5-10-5z",
  "M2 17l10 5 10-5",
  "M2 12l10 5 10-5",
]);

// Refresh
export const RefreshIcon = multiPath([
  "M23 4v6h-6",
  "M1 20v-6h6",
  "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
]);

// Sliders / Settings
export const SlidersIcon = multiPath([
  "M4 21v-7",
  "M4 10V3",
  "M12 21v-9",
  "M12 8V3",
  "M20 21v-5",
  "M20 12V3",
  "M1 14h6",
  "M9 8h6",
  "M17 16h6",
]);

// X / Close
export const XIcon = multiPath([
  "M18 6L6 18",
  "M6 6l12 12",
]);
