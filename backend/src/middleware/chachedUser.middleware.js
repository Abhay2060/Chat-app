import client from "../lib/redis.js";

const checkSignupSession = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // check in Redis
    const cachedUser = await client.get(`user:${email}`);

    if (cachedUser) {
      // parse if stored as JSON
      req.cachedUser = JSON.parse(cachedUser);

      // optional: flag for controller
      req.isCached = true;
    } else {
      req.isCached = false;
    }

    next();
  } catch (error) {
    console.error("Redis error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default checkSignupSession;