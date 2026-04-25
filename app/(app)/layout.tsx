import BottomNav from "@/components/BottomNav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame">
      {children}
      <BottomNav />
    </div>
  );
}
