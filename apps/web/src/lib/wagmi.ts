import { createConfig, http, injected } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";

/** Wallet config for the ArbiStealth client. Arbitrum Sepolia only for now,
 *  matching Phase 1 of the deployment plan; Arbitrum One is added once the
 *  contracts have been reviewed and deployed there. */
export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
