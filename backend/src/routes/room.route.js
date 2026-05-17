import express from "express";
import { protectRoute }   from "../middleware/auth.middleware.js";
import { checkKicked }    from "../middleware/CheckKicked.middleware.js";

import {
  getAllRooms,
  getPopularRooms,
  getMyRooms,
  getRoomByCode,
  getRoomById,
  getRoomInfo,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  getRoomMessages,
  sendRoomMessage,
  reactToRoomMessage,
  verifyRoomPassword,
} from "../controllers/room.controller.js";

import {
  kickMember,
  unkickMember,
} from "../controllers/Kick.controller.js";

const router = express.Router();

router.use(protectRoute); // all routes require login

// ── Room CRUD ──────────────────────────────────────────────────────────────────
router.get("/",           getAllRooms);
router.get("/popular",    getPopularRooms);   // top rooms by member count
router.get("/my-rooms",   getMyRooms);
router.get("/code/:code", getRoomByCode);     // find room by 6-digit code
router.get("/:id",        getRoomById);
router.post("/create",    createRoom);
router.put("/:id",        updateRoom);
router.delete("/:id",     deleteRoom);

// ── Membership ─────────────────────────────────────────────────────────────────
router.post("/:id/join",             checkKicked, joinRoom);
router.post("/:id/leave",            leaveRoom);
router.post("/:id/verify-password",  checkKicked, verifyRoomPassword);

// ── Kick / Unblock ─────────────────────────────────────────────────────────────
router.post("/:id/kick/:userId",     kickMember);
router.delete("/:id/kick/:userId",   unkickMember);

// ── Members ────────────────────────────────────────────────────────────────────
router.get("/:id/members",           getRoomMembers);
router.get("/:id/room-info",         getRoomInfo);     // roomCode + password for members

// ── Messages ───────────────────────────────────────────────────────────────────
router.get("/:id/messages",                    checkKicked, getRoomMessages);
router.post("/:id/messages/send",              checkKicked, sendRoomMessage);
router.post("/:id/messages/:messageId/react",  reactToRoomMessage);

export default router;