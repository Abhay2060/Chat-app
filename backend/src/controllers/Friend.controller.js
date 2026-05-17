import FriendRequest from "../models/Freind.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// ─── Helper: emit to a specific user if online ────────────────────────────────
const emitToUser = (userId, event, data) => {
  const socketId = getReceiverSocketId(userId.toString());
  if (socketId) io.to(socketId).emit(event, data);
};

// ─── POST /api/friends/request/:receiverId ────────────────────────────────────
// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId    = req.user._id;
    const receiverId  = req.params.receiverId;

    if (senderId.toString() === receiverId)
      return res.status(400).json({ message: "You cannot send a request to yourself" });

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists)
      return res.status(404).json({ message: "User not found" });

    // Check if request already exists in either direction
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId,   receiver: receiverId },
        { sender: receiverId, receiver: senderId   },
      ],
    });

    if (existing) {
      if (existing.status === "pending")
        return res.status(400).json({ message: "Friend request already sent" });
      if (existing.status === "accepted")
        return res.status(400).json({ message: "You are already friends" });
    }

    const request = await FriendRequest.create({
      sender:   senderId,
      receiver: receiverId,
    });

    const populated = await request.populate("sender", "fullName profilePic");

    // Notify receiver in real-time if they are online
    emitToUser(receiverId, "friendRequestReceived", populated);

    res.status(201).json(populated);
  } catch (error) {
    console.log("Error in sendFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/friends/requests ────────────────────────────────────────────────
// Get all pending incoming requests for the logged-in user
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status:   "pending",
    }).populate("sender", "fullName profilePic email");

    res.status(200).json(requests);
  } catch (error) {
    console.log("Error in getPendingRequests:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── PUT /api/friends/request/:requestId/accept ───────────────────────────────
// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId)
      .populate("sender",   "fullName profilePic")
      .populate("receiver", "fullName profilePic");

    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (request.receiver._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your request to accept" });

    if (request.status !== "pending")
      return res.status(400).json({ message: "Request already handled" });

    request.status = "accepted";
    await request.save();

    // Notify the sender that their request was accepted
    emitToUser(request.sender._id, "friendRequestAccepted", {
      requestId: request._id,
      acceptedBy: request.receiver,
    });

    res.status(200).json(request);
  } catch (error) {
    console.log("Error in acceptFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── PUT /api/friends/request/:requestId/reject ───────────────────────────────
// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (request.receiver.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your request to reject" });

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/friends ─────────────────────────────────────────────────────────
// Get all accepted friends of logged-in user
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender",   "fullName profilePic email")
      .populate("receiver", "fullName profilePic email");

    // Return the "other" person in each accepted request
    const friends = requests.map((r) =>
      r.sender._id.toString() === userId.toString() ? r.receiver : r.sender
    );

    res.status(200).json(friends);
  } catch (error) {
    console.log("Error in getFriends:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};