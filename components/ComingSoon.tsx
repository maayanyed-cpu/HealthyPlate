type Props = {
  title: string;
  blurb: string;
  emoji: string;
};

export default function ComingSoon({ title, blurb, emoji }: Props) {
  return (
    <div className="screen items-center justify-center px-7 text-center">
      <div className="w-20 h-20 bg-sage-pale rounded-full flex items-center justify-center text-[40px] mb-6">
        {emoji}
      </div>
      <div className="text-[12px] tracking-[0.16em] uppercase text-sage-deep font-semibold mb-2">
        Coming soon
      </div>
      <h2 className="font-serif text-[26px] font-medium text-ink mb-2 leading-tight">
        {title}
      </h2>
      <p className="text-[14px] text-ink-soft leading-[1.55] max-w-[280px]">
        {blurb}
      </p>
    </div>
  );
}
