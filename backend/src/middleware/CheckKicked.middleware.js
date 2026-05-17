import User from "../models/User.js";
import Room from "../models/Room.js";

// ─── checkKicked middleware ───────────────────────────────────────────────────
// Use on any route where a user is trying to enter or join a room.
// Checks if the user has been kicked from that specific room.
//
// Usage in routes:
//   router.post("/:id/join",         checkKicked, joinRoom);
//   router.post("/:id/verify-password", checkKicked, verifyRoomPassword);
//   router.get("/:id/messages",      checkKicked, getRoomMessages);

export const checkKicked = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const roomId = req.params.id;

    const user = await User.findById(userId).select("kickedFromRooms");

    // Check if this roomId is in the user's kickedFromRooms list
    const isKicked = user.kickedFromRooms.some(
      (id) => id.toString() === roomId.toString()
    );

    if (!isKicked) return next(); // not kicked — proceed normally

    // Kicked — fetch room name for the error message
    const room = await Room.findById(roomId).select("name");
    const roomName = room?.name || "this room";

    return res.status(403).json({
      message: `You are blocked from ${roomName}`,
      kicked: true,
    });
  } catch (error) {
    console.log("Error in checkKicked middleware:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};