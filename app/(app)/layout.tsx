"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { OnboardingGate } from "@/components/onboarding-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/workouts/active");

  return (
    <OnboardingGate>
      <div className="device-stage min-h-screen px-0 md:px-4">
        <div className="device-shell mx-auto min-h-screen w-full max-w-[430px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(195,255,77,0.14),transparent_52%)]" />
          <main className="relative screen-padding page-enter">{children}</main>
        </div>
        {!hideNav ? <BottomNav /> : null}
      </div>
    </OnboardingGate>
  );
}
