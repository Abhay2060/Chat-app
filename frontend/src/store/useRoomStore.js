import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useRoomStore = create((set, get) => ({
  rooms:         [],
  myRooms:       [],
  activeRoom:    null,
  roomMessages:  [],
  roomMembers:   [],  // all permanent members (from DB)
  roomViewers: [], // full user objects currently on this chat page (from socket)
  roomViewerCounts: {}, // { roomId: count } for lobby cards

  isRoomsLoading:        false,
  isRoomMessagesLoading: false,
  isCreatingRoom:        false,
  isJoiningRoom:         false,

  // ── Room Fetching ────────────────────────────────────────────────────────────

  getAllRooms: async () => {
    set({ isRoomsLoading: true });
    try {
      const res = await axiosInstance.get("/rooms");
      set({ rooms: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load rooms");
    } finally {
      set({ isRoomsLoading: false });
    }
  },

  // ── Subscribe to lobby viewer counts (call once when lobby mounts) ──────────
  // Called once when RoomChatPage mounts — stays active, never torn down on re-render
  subscribeToViewers: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) { console.warn("[viewers] no socket yet"); return; }
    socket.off("roomViewersUpdated");
    socket.on("roomViewersUpdated", ({ viewers }) => {
      console.log("[viewers] roomViewersUpdated received:", viewers.map(v => v.fullName));
      set({ roomViewers: viewers });
    });
    console.log("[viewers] listener registered on socket:", socket.id);
  },

  unsubscribeFromViewers: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("roomViewersUpdated");
  },

  subscribeToViewerCounts: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("roomViewerCountUpdated"); // prevent duplicates
    socket.on("roomViewerCountUpdated", ({ roomId, count }) => {
      set({
        roomViewerCounts: { ...useRoomStore.getState().roomViewerCounts, [roomId]: count },
      });
    });
  },

  unsubscribeFromViewerCounts: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("roomViewerCountUpdated");
  },

  getMyRooms: async () => {
    set({ isRoomsLoading: true });
    try {
      const res = await axiosInstance.get("/rooms/my-rooms");
      set({ myRooms: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load your rooms");
    } finally {
      set({ isRoomsLoading: false });
    }
  },

  // ── Active Room ──────────────────────────────────────────────────────────────

  setActiveRoom: (room) => {
    set({ activeRoom: room, roomMessages: [], roomMembers: [], roomViewers: [] });
  },

  clearActiveRoom: () => set({ activeRoom: null, roomMessages: [], roomMembers: [], roomViewers: [] }),

  // ── Messages ────────────────────────────────────────────────────────────────

  getRoomMessages: async (roomId) => {
    set({ isRoomMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}/messages`);
      set({ roomMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isRoomMessagesLoading: false });
    }
  },

  getRoomMembers: async (roomId) => {
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}/members`);
      set({ roomMembers: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load members");
    }
  },

  // ── Room CRUD ────────────────────────────────────────────────────────────────

  createRoom: async (roomData) => {
    set({ isCreatingRoom: true });
    try {
      const res = await axiosInstance.post("/rooms/create", roomData);
      set({ rooms: [...get().rooms, res.data], myRooms: [...get().myRooms, res.data] });
      toast.success(`Room "${res.data.name}" created!`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create room");
      return null;
    } finally {
      set({ isCreatingRoom: false });
    }
  },

  updateRoom: async (roomId, data) => {
    try {
      const res = await axiosInstance.put(`/rooms/${roomId}`, data);
      set({
        rooms:   get().rooms.map((r)   => r._id === roomId ? res.data : r),
        myRooms: get().myRooms.map((r) => r._id === roomId ? res.data : r),
      });
      toast.success("Room updated!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update room");
      return null;
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      set({
        rooms:   get().rooms.filter((r)   => r._id !== roomId),
        myRooms: get().myRooms.filter((r) => r._id !== roomId),
      });
      if (get().activeRoom?._id === roomId) get().clearActiveRoom();
      toast.success("Room deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete room");
    }
  },

  // ── Membership ───────────────────────────────────────────────────────────────

  joinRoom: async (roomId) => {
    set({ isJoiningRoom: true });
    try {
      const res = await axiosInstance.post(`/rooms/${roomId}/join`);
      const alreadyIn = get().myRooms.some((r) => r._id === roomId);
      if (!alreadyIn) set({ myRooms: [...get().myRooms, res.data] });
      set({ rooms: get().rooms.map((r) => r._id === roomId ? res.data : r) });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join room");
      return null;
    } finally {
      set({ isJoiningRoom: false });
    }
  },

  leaveRoom: async (roomId) => {
    try {
      await axiosInstance.post(`/rooms/${roomId}/leave`);
      set({ myRooms: get().myRooms.filter((r) => r._id !== roomId) });
      if (get().activeRoom?._id === roomId) get().clearActiveRoom();
      toast.success("Left the room");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave room");
    }
  },

  // ── Send Message ─────────────────────────────────────────────────────────────

  sendRoomMessage: async (messageData) => {
    const { activeRoom, roomMessages } = get();
    const { authUser } = useAuthStore.getState();
    if (!activeRoom) return;

    // Optimistic update — same pattern as useChatStore
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id:       tempId,
      senderId:  { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
      roomId:    activeRoom._id,
      text:      messageData.text,
      image:     messageData.image,
      reactions: {},
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ roomMessages: [...roomMessages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/rooms/${activeRoom._id}/messages/send`, messageData);
      set({
        roomMessages: get().roomMessages.map((msg) =>
          msg._id === tempId ? res.data : msg
        ),
      });
    } catch (error) {
      set({ roomMessages });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ── React to Message ─────────────────────────────────────────────────────────
  // Same logic as useChatStore.reactToMessage

  reactToRoomMessage: async (messageId, emoji) => {
    try {
      const userId = useAuthStore.getState().authUser._id;
      const activeRoom = useRoomStore.getState().activeRoom; // always fresh

      if (!activeRoom) return toast.error("No active room");

      // Optimistic update
      const updatedMessages = useRoomStore.getState().roomMessages.map((msg) => {
        if (msg._id !== messageId) return msg;
        const reactions = JSON.parse(JSON.stringify(msg.reactions || {}));

        let previousEmoji = null;
        for (const [key, users] of Object.entries(reactions)) {
          if (users.includes(userId.toString())) { previousEmoji = key; break; }
        }
        for (const key of Object.keys(reactions)) {
          reactions[key] = reactions[key].filter((id) => id.toString() !== userId.toString());
        }
        if (previousEmoji !== emoji) {
          reactions[emoji] = [...(reactions[emoji] || []), userId.toString()];
        }
        return { ...msg, reactions };
      });

      set({ roomMessages: updatedMessages });

      const res = await axiosInstance.post(
        `/rooms/${activeRoom._id}/messages/${messageId}/react`,
        { emoji }
      );

      set({
        roomMessages: useRoomStore.getState().roomMessages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        ),
      });
    } catch (error) {
      toast.error("Failed to react");
    }
  },

  // ── Socket Subscriptions ─────────────────────────────────────────────────────

  subscribeToRoomMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newRoomMessage", (newMessage) => {
      const { activeRoom } = useRoomStore.getState();
      if (!activeRoom) return;

      // Skip if this message was sent by the current user — optimistic update already added it
      const { authUser } = useAuthStore.getState();
      const senderId = newMessage.senderId?._id || newMessage.senderId;
      if (senderId?.toString() === authUser._id?.toString()) return;

      if (newMessage.roomId?.toString() !== activeRoom._id?.toString()) return;

      set({ roomMessages: [...useRoomStore.getState().roomMessages, newMessage] });
    });

    socket.on("roomMessageReacted", ({ messageId, reactions }) => {
      set({
        roomMessages: useRoomStore.getState().roomMessages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      });
    });

    socket.on("roomMemberJoined", ({ roomId, user }) => {
      const state = useRoomStore.getState();

      // Update sidebar members list
      const alreadyIn = state.roomMembers.some((m) => m._id?.toString() === user._id?.toString());
      if (!alreadyIn) set({ roomMembers: [...state.roomMembers, user] });

      // Update members array in rooms + myRooms so RoomCard count stays accurate
      const addMember = (list) =>
        list.map((r) =>
          r._id?.toString() === roomId?.toString() &&
          !r.members?.some((id) => (id._id || id).toString() === user._id.toString())
            ? { ...r, members: [...(r.members || []), user._id] }
            : r
        );

      set({
        rooms:   addMember(state.rooms),
        myRooms: addMember(state.myRooms),
      });
    });

    socket.on("roomMemberLeft", ({ roomId, userId }) => {
      const state = useRoomStore.getState();

      // Update sidebar members list (used in chat page)
      set({
        roomMembers: state.roomMembers.filter(
          (m) => m._id?.toString() !== userId?.toString()
        ),
      });

      // Update members array in rooms + myRooms so RoomCard count stays accurate
      const removeMember = (list) =>
        list.map((r) =>
          r._id?.toString() === roomId?.toString()
            ? { ...r, members: r.members.filter((id) => (id._id || id).toString() !== userId.toString()) }
            : r
        );

      set({
        rooms:   removeMember(state.rooms),
        myRooms: removeMember(state.myRooms),
      });
    });

    socket.on("roomUpdated", (updatedRoom) => {
      const { activeRoom } = useRoomStore.getState();
      if (!activeRoom || updatedRoom._id !== activeRoom._id) return;
      set({ activeRoom: updatedRoom });
    });

    socket.on("roomDeleted", ({ roomId }) => {
      const { activeRoom } = useRoomStore.getState();
      if (!activeRoom || roomId !== activeRoom._id) return;
      toast.error("This room has been deleted");
      useRoomStore.getState().clearActiveRoom();
    });

    // ── Kick event ──────────────────────────────────────────────────────────
    socket.on("memberKicked", ({ roomId, kickedUserId, roomName }) => {
      const { authUser } = useAuthStore.getState();
      const { activeRoom } = useRoomStore.getState();

      // Remove member from sidebar list for everyone in the room
      set({
        roomMembers: useRoomStore.getState().roomMembers.filter(
          (m) => m._id !== kickedUserId
        ),
      });

      // If the kicked user is the current user — show message and redirect
      if (kickedUserId === authUser._id) {
        toast.error(`You have been removed from ${roomName}`);
        useRoomStore.getState().clearActiveRoom();
        // Navigate to lobby — handled in RoomChatPage via activeRoom becoming null
      }
    });
  },

  unsubscribeFromRoomMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newRoomMessage");
    socket.off("roomMessageReacted");
    socket.off("roomMemberJoined");
    socket.off("roomMemberLeft");
    socket.off("roomUpdated");
    socket.off("roomDeleted");
    socket.off("memberKicked");
  },
}));