import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// ─── Helper ───────────────────────────────────────────────────────────────────
const emitToRoom = (roomId, event, data) => {
  io.to(`room:${roomId}`).emit(event, data);
};

// ─── GET /api/rooms ───────────────────────────────────────────────────────────
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate("createdBy", "fullName profilePic")
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    console.log("Error in getAllRooms:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/popular ───────────────────────────────────────────────────
// Returns top rooms sorted by member count (for Explore page)
export const getPopularRooms = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    const rooms = await Room.find({ isActive: true, isPrivate: false }) // only public rooms
      .populate("createdBy", "fullName profilePic")
      .select("-password")
      .lean();

    // Sort by members array length descending
    rooms.sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0));

    res.status(200).json(rooms.slice(0, limit));
  } catch (error) {
    console.log("Error in getPopularRooms:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/my-rooms ──────────────────────────────────────────────────
export const getMyRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      isActive: true,
      $or: [{ createdBy: userId }, { members: userId }],
    })
      .populate("createdBy", "fullName profilePic")
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    console.log("Error in getMyRooms:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/code/:code ────────────────────────────────────────────────
// Find a room by its 6-digit roomCode (for Explore page search)
export const getRoomByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ roomCode: code, isActive: true })
      .populate("createdBy", "fullName profilePic")
      .select("-password");

    if (!room) {
      return res.status(404).json({ message: "No room found with that code" });
    }

    res.status(200).json(room);
  } catch (error) {
    console.log("Error in getRoomByCode:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/:id ───────────────────────────────────────────────────────
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("createdBy", "fullName profilePic")
      .populate("members", "fullName profilePic email");

    if (!room || !room.isActive) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    console.log("Error in getRoomById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/rooms/create ───────────────────────────────────────────────────
export const createRoom = async (req, res) => {
  try {
    const { name, description, emoji, accentColor, isPrivate, maxMembers, password } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const room = await Room.create({
      name:          name.trim(),
      description:   description?.trim() || "",
      emoji:         emoji       || "💬",
      accentColor:   accentColor || "#4f8ef7",
      isPrivate:     isPrivate   || false,
      password:      isPrivate && password ? password : null,
      plainPassword: isPrivate && password ? password : null, // stored for display
      maxMembers:    maxMembers  || 100,
      createdBy:     userId,
      members:       [userId],
    });

    const populated = await room.populate("createdBy", "fullName profilePic");
    const result = populated.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    console.log("Error in createRoom:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── PUT /api/rooms/:id ───────────────────────────────────────────────────────
export const updateRoom = async (req, res) => {
  try {
    const { name, description, emoji, accentColor, isPrivate, maxMembers, password } = req.body;
    const userId = req.user._id;

    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });
    if (room.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: "Only the room owner can edit this room" });

    if (name !== undefined)        room.name        = name.trim();
    if (description !== undefined) room.description = description.trim();
    if (emoji !== undefined)       room.emoji       = emoji;
    if (accentColor !== undefined) room.accentColor = accentColor;
    if (maxMembers !== undefined)  room.maxMembers  = maxMembers;

    if (isPrivate !== undefined) {
      const switchingToPrivate = isPrivate && !room.isPrivate;
      if (switchingToPrivate) {
        if (!password || !password.trim())
          return res.status(400).json({ message: "Password is required to make a room private" });
        room.password      = password;
        room.plainPassword = password; // store plain for display
      }
      if (!isPrivate) {
        room.password      = null;
        room.plainPassword = null;
      }
      room.isPrivate = isPrivate;
    }

    await room.save();
    const updated = await Room.findById(room._id)
      .select("-password")
      .populate("createdBy", "fullName profilePic");

    emitToRoom(room._id, "roomUpdated", updated);
    res.status(200).json(updated);
  } catch (error) {
    console.log("Error in updateRoom:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── DELETE /api/rooms/:id ────────────────────────────────────────────────────
export const deleteRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await Room.findById(req.params.id);

    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });
    if (room.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: "Only the room owner can delete this room" });

    room.isActive = false;
    await room.save();

    emitToRoom(room._id, "roomDeleted", { roomId: room._id });
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.log("Error in deleteRoom:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/rooms/:id/join ─────────────────────────────────────────────────
export const joinRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await Room.findById(req.params.id);

    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });
    if (room.isPrivate) {
      const alreadyMember = room.members.some((m) => m.toString() === userId.toString());
      if (!alreadyMember) return res.status(403).json({ message: "This room is private", requiresPassword: true });
    }
    if (room.members.length >= room.maxMembers)
      return res.status(400).json({ message: "Room is full" });

    const updated = await Room.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    ).select("-password")
      .populate("createdBy", "fullName profilePic");

    const user = await User.findById(userId).select("fullName profilePic email");
    emitToRoom(room._id, "roomMemberJoined", { roomId: room._id, user });

    res.status(200).json(updated);
  } catch (error) {
    console.log("Error in joinRoom:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/rooms/:id/leave ────────────────────────────────────────────────
export const leaveRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await Room.findById(req.params.id);

    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });
    if (room.createdBy.toString() === userId.toString())
      return res.status(400).json({ message: "Owner cannot leave. Delete the room instead." });

    await Room.findByIdAndUpdate(req.params.id, { $pull: { members: userId } });
    emitToRoom(room._id, "roomMemberLeft", { roomId: room._id, userId });

    res.status(200).json({ message: "Left the room successfully" });
  } catch (error) {
    console.log("Error in leaveRoom:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/:id/members ───────────────────────────────────────────────
export const getRoomMembers = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("members", "fullName profilePic email createdAt");

    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });

    res.status(200).json(room.members);
  } catch (error) {
    console.log("Error in getRoomMembers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/:id/messages ──────────────────────────────────────────────
export const getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.id;

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });

    const messages = await Message.find({ receiverId: roomId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getRoomMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/rooms/:id/messages/send ───────────────────────────────────────
export const sendRoomMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user._id;
    const roomId   = req.params.id;

    if (!text && !image) return res.status(400).json({ message: "Text or image is required." });

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });

    const isMember = room.members.some((m) => m.toString() === senderId.toString());
    if (!isMember) return res.status(403).json({ message: "You must join the room to send messages" });

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId: roomId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    await Room.findByIdAndUpdate(roomId, { $push: { messages: newMessage._id } });

    const populated = await newMessage.populate("senderId", "fullName profilePic");
    const messageToEmit = { ...populated.toObject(), roomId: roomId.toString() };
    emitToRoom(roomId, "newRoomMessage", messageToEmit);

    res.status(201).json(populated);
  } catch (error) {
    console.log("Error in sendRoomMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/rooms/:id/messages/:messageId/react ────────────────────────────
export const reactToRoomMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const roomId        = req.params.id;
    const { emoji }     = req.body;
    const userId        = req.user._id.toString();

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    let previousEmoji = null;
    for (const [key, users] of message.reactions.entries()) {
      if (users.map((id) => id.toString()).includes(userId)) {
        previousEmoji = key;
        break;
      }
    }

    for (const [key, users] of message.reactions.entries()) {
      message.reactions.set(key, users.filter((id) => id.toString() !== userId));
    }

    if (previousEmoji !== emoji) {
      const currentUsers = message.reactions.get(emoji) || [];
      message.reactions.set(emoji, [...currentUsers, userId]);
    }

    message.markModified("reactions");
    await message.save();

    const reactionsObj = Object.fromEntries(message.reactions);
    emitToRoom(roomId, "roomMessageReacted", { messageId, reactions: reactionsObj });

    res.json({ reactions: reactionsObj });
  } catch (error) {
    console.log("Error in reactToRoomMessage:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─── POST /api/rooms/:id/verify-password ──────────────────────────────────────
export const verifyRoomPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) return res.status(400).json({ message: "Password is required" });

    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });

    const alreadyMember = room.members.some((m) => m.toString() === userId.toString());
    if (alreadyMember) return res.status(400).json({ message: "Already a member" });

    const isMatch = await room.verifyPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    if (room.members.length >= room.maxMembers)
      return res.status(400).json({ message: "Room is full" });

    const updated = await Room.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    ).select("-password")
      .populate("createdBy", "fullName profilePic");

    const user = await User.findById(userId).select("fullName profilePic email");
    emitToRoom(room._id, "roomMemberJoined", { roomId: room._id, user });

    res.status(200).json(updated);
  } catch (error) {
    console.log("Error in verifyRoomPassword:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/rooms/:id/room-info ─────────────────────────────────────────────
// Returns roomCode + plain-text password for members only
// Password is stored hashed so we return a note for non-owners,
// but the owner sees it in plaintext only if they stored it (we can't un-hash).
// For simplicity: we store the plain password in a separate field for display only.
// NOTE: Since passwords are bcrypt-hashed, we cannot reverse them.
// We only return the roomCode here. For password display, add a plainPassword
// field to the Room model (see note below).
export const getRoomInfo = async (req, res) => {
  try {
    const userId = req.user._id;

    // Use +plainPassword to explicitly include the select:false field
    const room = await Room.findById(req.params.id)
      .select("roomCode members isPrivate isActive +plainPassword");

    if (!room || !room.isActive) return res.status(404).json({ message: "Room not found" });

    // Only members can access room info
    const isMember = room.members.some((m) => m.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Members only" });

    res.status(200).json({
      roomCode: room.roomCode,
      password: room.isPrivate ? (room.plainPassword || null) : null,
    });
  } catch (error) {
    console.log("Error in getRoomInfo:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};