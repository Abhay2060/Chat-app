import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
} from "../controllers/Friend.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/request/:receiverId",       sendFriendRequest);   // send request
router.get("/requests",                   getPendingRequests);  // get pending incoming
router.put("/request/:requestId/accept",  acceptFriendRequest); // accept
router.put("/request/:requestId/reject",  rejectFriendRequest); // reject
router.get("/",                           getFriends);           // get all friends

export default router;