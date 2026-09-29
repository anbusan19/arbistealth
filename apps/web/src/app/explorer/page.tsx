"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/layouts/AppLayout";
import { Loader } from "@/components/ui/Loader";

/** Explorer was merged into the bento dashboard's "Recent Activity" panel. */
export default function ExplorerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <AppLayout>
      <div className="flex justify-center py-24">
        <Loader label="REDIRECTING TO DASHBOARD…" />
      </div>
    </AppLayout>
  );
}
