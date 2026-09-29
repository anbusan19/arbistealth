"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { wagmiConfig } from "@/lib/wagmi";
import { SiteMenu } from "@/components/SiteMenu";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Remounts (rather than an effect + setState) on navigation, so the
            open menu naturally resets to closed with no route-change effect. */}
        <SiteMenu key={pathname} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
