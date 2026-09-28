import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

const config = loadConfig();
const app = createServer(config);

app.listen(config.port, () => {
  console.log(`ArbiStealth relayer listening on :${config.port} (chainId=${config.domain.chainId})`);
});
