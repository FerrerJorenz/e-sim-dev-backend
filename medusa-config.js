import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment file
let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}
// Load env variables
dotenv.config({ path: path.join(__dirname, ENV_FILE_NAME) });

// CORS configuration
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

// Docker-based services
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/medusa";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Plugins
const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `medusa-payment-paypal`,
    options: {
      sandbox: process.env.PAYPAL_SANDBOX === "true",
client_id: process.env.PAYPAL_CLIENT_ID,
client_secret: process.env.PAYPAL_CLIENT_SECRET,
auth_webhook_id: process.env.PAYPAL_AUTH_WEBHOOK_ID,
},
},
{
resolve: `medusa-payment-stripe`,
options: {
api_key: process.env.STRIPE_API_KEY,
webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
},
},
 {
    resolve: "medusa-file-local",
    options: {
      upload_dir: "uploads", // or your preferred directory
    },
  },
{
resolve: "@medusajs/admin",
options: {
autoRebuild: true,
},
},
// Temporarily disabled MeiliSearch to fix communication errors
  // {
  //   resolve: "medusa-plugin-meilisearch",
  //   options: {
  //     config: {
  //       host: process.env.MEILISEARCH_HOST,
  //       apiKey: process.env.MEILISEARCH_API_KEY,
  //     },
  //     settings: {
  //       "product-collection": {
  //         indexSettings: {
  //           searchableAttributes: ["title"],
  //           displayedAttributes: [
  //             "id",
  //             "title",
  //             "handle",
  //           ],
  //         },
  //         primaryKey: "id",
  //       },
  //       products: {
  //         indexSettings: {
  //           searchableAttributes: ["title", "description", "variant_sku"],
  //           displayedAttributes: [
  //             "id",
  //             "title",
  //             "description",
  //             "variant_sku",
  //             "thumbnail",
  //             "handle",
  //           ],
  //         },
  //         primaryKey: "id",
  //       },
  //     },
  //   },
  // },
];
// Redis-based modules
const modules = {
  eventBus: {
    resolve: "@medusajs/event-bus-redis",
    options: {
      redisUrl: "redis://localhost:6379",
    },
  },
  cacheService: {
    resolve: "@medusajs/cache-redis",
    options: {
      redisUrl: "redis://localhost:6379",
    },
  },
};
// Project configuration
const projectConfig = {
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  cookieSecret: process.env.COOKIE_SECRET || "supersecret",
  store_cors: STORE_CORS,
  database_url: DATABASE_URL,
  admin_cors: ADMIN_CORS,
  redis_url: "redis://localhost:6379",
  database_type: "postgres",
  database_extra: {
    ssl: false,
  },
};

// Export as ESM default
export default {
  projectConfig,
  plugins,
  modules,
};
