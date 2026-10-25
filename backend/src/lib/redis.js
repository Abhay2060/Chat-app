import { createClient } from "redis";
import { ENV } from "./env";

const client = createClient({
<<<<<<< HEAD
  url: ENV.REDIS_URL,
=======
  url: "redis url",
>>>>>>> 5dd91bc14d57f28075f4929df1bbb6af62748c7b
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

await client.connect();

export default client;
