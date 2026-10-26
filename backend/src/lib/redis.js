import { createClient } from "redis";
import { ENV } from "./env.js";

const client = createClient({
  url: ENV.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

await client.connect();

export default client;