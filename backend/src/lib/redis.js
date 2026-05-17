import { createClient } from "redis";

const client = createClient({
  url: "redis://default:harsh@123@redis-12788.crce263.ap-south-1-1.ec2.cloud.redislabs.com:12788",
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

await client.connect();

export default client;