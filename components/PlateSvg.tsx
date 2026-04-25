/* The hero plate — same one is shown in /snap (full) and /snap/analysis (smaller).
   Used as a stable visual stand-in for a real camera view in v0. */

type Props = {
  className?: string;
  /* Render the "after" view: most of the carrots/broccoli/couscous removed. */
  variant?: "before" | "after";
};

export default function PlateSvg({ className, variant = "before" }: Props) {
  const isAfter = variant === "after";
  return (
    <svg viewBox="0 0 320 360" className={className}>
      <ellipse cx="160" cy="200" rx="140" ry="120" fill="#F5F1E8" />
      <ellipse
        cx="160"
        cy="200"
        rx="120"
        ry="100"
        fill="#FAF7F0"
        stroke="#E8E5DD"
        strokeWidth="2"
      />
      {!isAfter && (
        <>
          <ellipse cx="100" cy="170" rx="22" ry="14" fill="#D88463" />
          <ellipse cx="100" cy="168" rx="14" ry="6" fill="#E8946A" />
          <ellipse cx="130" cy="155" rx="18" ry="11" fill="#D88463" />
          <circle cx="200" cy="160" r="14" fill="#5A8073" />
          <circle cx="215" cy="170" r="11" fill="#5A8073" />
          <circle cx="195" cy="175" r="9" fill="#4A6B5F" />
          <circle cx="220" cy="158" r="9" fill="#4A6B5F" />
          <g>
            {[
              [160, 240], [170, 245], [180, 240], [155, 250], [175, 255],
              [165, 255], [190, 248], [150, 245], [185, 258], [145, 258],
              [160, 262], [172, 265],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill="#E5B96A" />
            ))}
          </g>
        </>
      )}
      {isAfter && (
        <>
          <ellipse cx="100" cy="170" rx="6" ry="4" fill="#D88463" />
          <circle cx="200" cy="160" r="14" fill="#5A8073" />
          <circle cx="220" cy="158" r="9" fill="#4A6B5F" />
          <g>
            {[
              [160, 240], [170, 245], [150, 245],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill="#E5B96A" />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
