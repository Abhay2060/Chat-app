import User from "../models/User.js";
import Room from "../models/Room.js";
import { io } from "../lib/socket.js";

// ─── POST /api/rooms/:id/kick/:userId ─────────────────────────────────────────
// Owner kicks a member out of the room
export const kickMember = async (req, res) => {
  try {
    const ownerId      = req.user._id;
    const { id: roomId, userId: targetUserId } = req.params;

    // 1. Verify room exists and caller is the owner
    const room = await Room.findById(roomId);
    if (!room || !room.isActive)
      return res.status(404).json({ message: "Room not found" });

    if (room.createdBy.toString() !== ownerId.toString())
      return res.status(403).json({ message: "Only the room owner can kick members" });

    // 2. Can't kick yourself
    if (targetUserId === ownerId.toString())
      return res.status(400).json({ message: "You cannot kick yourself" });

    // 3. Remove user from room members
    await Room.findByIdAndUpdate(roomId, {
      $pull: { members: targetUserId },
    });

    // 4. Add roomId to the user's kickedFromRooms list
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { kickedFromRooms: roomId }, // $addToSet prevents duplicates
    });

    // 5. Force-disconnect the kicked user from the socket room
    //    and notify everyone in the room
    io.to(`room:${roomId}`).emit("memberKicked", {
      roomId,
      kickedUserId: targetUserId,
      roomName: room.name,
    });

    res.status(200).json({ message: "Member kicked successfully" });
  } catch (error) {
    console.log("Error in kickMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── DELETE /api/rooms/:id/kick/:userId ───────────────────────────────────────
// Owner un-kicks (unblocks) a member — optional but good to have
export const unkickMember = async (req, res) => {
  try {
    const ownerId      = req.user._id;
    const { id: roomId, userId: targetUserId } = req.params;

    const room = await Room.findById(roomId);
    if (!room || !room.isActive)
      return res.status(404).json({ message: "Room not found" });

    if (room.createdBy.toString() !== ownerId.toString())
      return res.status(403).json({ message: "Only the room owner can unblock members" });

    // Remove roomId from user's kickedFromRooms
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { kickedFromRooms: roomId },
    });

    res.status(200).json({ message: "Member unblocked successfully" });
  } catch (error) {
    console.log("Error in unkickMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};