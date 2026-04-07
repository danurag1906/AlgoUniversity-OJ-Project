import { config } from "dotenv";
import dns from "dns";

config();

// Node.js uses c-ares for DNS which doesn't work with macOS link-local IPv6 resolvers.
// Setting Google DNS ensures SRV lookups (required for mongodb+srv://) work correctly.
dns.setServers(["8.8.8.8", "8.8.4.4"]);
