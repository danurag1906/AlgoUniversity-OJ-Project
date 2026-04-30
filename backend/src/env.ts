import { config } from "dotenv";
import dns from "dns";

// Loads environment variables from `.env` into `process.env`.
// Example: `process.env.MONGODB_URI` becomes available after this call.
config();

/**
 * DNS workaround:
 *
 * Node uses the `c-ares` resolver in some scenarios. On macOS, SRV lookups
 * (needed for `mongodb+srv://...`) can fail depending on resolver configuration.
 *
 * Setting well-known DNS servers helps ensure MongoDB SRV records can be resolved.
 */
// Node.js uses c-ares for DNS which doesn't work with macOS link-local IPv6 resolvers.
// Setting Google DNS ensures SRV lookups (required for mongodb+srv://) work correctly.
dns.setServers(["8.8.8.8", "8.8.4.4"]);
