import { createClient } from "redis";

const client = createClient({
  url: "redis url",
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

await client.connect();

export default client;
