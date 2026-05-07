import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="app-frame">
      <div className="screen items-center px-7 pt-16 pb-8">
        <div className="w-20 h-20 rounded-full bg-sage-pale flex items-center justify-center mb-7">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M22 4 C30 8, 36 14, 38 22 C36 32, 28 38, 22 40 C16 38, 8 32, 6 22 C8 14, 14 8, 22 4 Z"
              fill="#5A8073"
            />
            <path
              d="M22 12 C26 16, 28 20, 22 32 C16 20, 18 16, 22 12 Z"
              fill="#A8BFA8"
            />
          </svg>
        </div>

        <div className="text-[13px] tracking-[0.18em] uppercase text-sage-deep font-medium mb-2 font-serif">
          Healthy Plate
        </div>

        <h1 className="font-serif text-[34px] leading-[1.15] font-medium text-ink text-center max-w-[320px] tracking-[-0.015em]">
          Raise a generation that <em className="text-sage-deep">loves</em> vegetables.
        </h1>

        <p className="text-[14px] text-ink-soft text-center mt-4 max-w-[300px] leading-[1.55]">
          A pocket nutritionist that learns your child — one meal at a time.
        </p>

        <div className="flex gap-2 mt-9 mb-auto">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path
              d="M22 8 C19 16, 18 24, 20 36 C22 38, 22 38, 24 36 C26 24, 25 16, 22 8 Z"
              fill="#D88463"
            />
            <path
              d="M22 8 C20 4, 17 4, 18 8 M22 8 C24 3, 27 4, 26 8 M22 8 C22 3, 22 3, 22 8"
              stroke="#5A8073"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="14" cy="14" r="6" fill="#5A8073" />
            <circle cx="22" cy="10" r="7" fill="#5A8073" />
            <circle cx="30" cy="14" r="6" fill="#5A8073" />
            <circle cx="20" cy="18" r="5" fill="#4A6B5F" />
            <path
              d="M18 22 L18 34 Q18 36 20 36 L24 36 Q26 36 26 34 L26 22 Z"
              fill="#E8DCB8"
            />
          </svg>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="26" r="14" fill="#C95C4D" />
            <path d="M22 12 L18 8 L22 10 L26 8 L24 12" fill="#5A8073" />
          </svg>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <path
              d="M22 12 C16 14, 14 22, 16 30 C18 36, 26 36, 28 30 C30 22, 28 14, 22 12 Z"
              fill="#E5B96A"
            />
            <path d="M22 12 L20 6 L24 6 L22 12 Z" fill="#5A8073" />
          </svg>
        </div>

        <div className="w-full mt-8 flex flex-col gap-2">
          <Link
            href="/onboarding"
            className="block w-full text-center bg-sage-deep hover:bg-ink text-cream-soft rounded-[20px] py-4 px-6 text-[15px] font-semibold transition-colors"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/snap"
            className="block w-full text-center text-ink-soft hover:text-ink py-2 text-[13px] font-medium"
          >
            Or snap a meal first →
          </Link>
          <p className="text-[11px] text-ink-mute text-center mt-2 leading-[1.5]">
            Trusted by 2,400+ families on the waitlist · Designed with pediatric dietitians
          </p>
        </div>
      </div>
    </div>
  );
}
