import { useId } from "react";

const brandColors: Record<string, string> = {
  facebook: "#1877F2",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  tiktok: "#000000",
};

export function BrandIcon({ name }: { name: string }) {
  const uid = useId().replace(/:/g, "");
  const key = name.toLowerCase().replace(/\s/g, "");
  const paths: Record<string, string> = {
    facebook:
      "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.931-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z",
    instagram:
      "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
    youtube:
      "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z",
    linkedin:
      "M20.45 0H3.55A3.55 3.55 0 0 0 0 3.55v16.9A3.55 3.55 0 0 0 3.55 24h16.9A3.55 3.55 0 0 0 24 20.45V3.55A3.55 3.55 0 0 0 20.45 0ZM7.1 20.45H3.55V9H7.1ZM5.32 7.44a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM20.45 20.45H16.9v-5.57c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.67H9.34V9h3.4v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.43Z",
    tiktok:
      "M16.6 0c.4 3.5 2.3 5.6 5.6 5.8v4c-2 0-3.9-.6-5.5-1.7v8.1c0 10.3-13.2 10.7-13.2 1.1 0-4.2 3.4-7.3 7.4-6.7v4.2c-4.4-1.4-5.4 5.7-1.1 5.7 1.8 0 2.8-1.2 2.8-3.4V0Z",
  };
  if (!paths[key]) return null;
  const igId = `ig-${uid}`;
  const fill =
    key === "instagram"
      ? `url(#${igId})`
      : brandColors[key] || "currentColor";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {key === "instagram" && (
        <defs>
          <linearGradient id={igId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
      )}
      {key === "tiktok" ? (
        <>
          <path
            d={paths.tiktok}
            fill="#25F4EE"
            transform="translate(-1.2 0.8)"
          />
          <path
            d={paths.tiktok}
            fill="#FE2C55"
            transform="translate(1.2 -0.8)"
          />
          <path d={paths.tiktok} fill="#000000" />
        </>
      ) : (
        <path d={paths[key]} fill={fill} />
      )}
    </svg>
  );
}
