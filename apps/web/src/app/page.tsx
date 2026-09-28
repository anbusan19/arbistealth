import { ConnectButton } from "@/components/ConnectButton";
import { IntentForm } from "@/components/IntentForm";
import { OpenIntents } from "@/components/OpenIntents";
import { PreferredFeeAsset } from "@/components/PreferredFeeAsset";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">ArbiStealth</h1>
        <ConnectButton />
      </header>

      <PreferredFeeAsset />
      <IntentForm />
      <OpenIntents />
    </main>
  );
}
