import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useFriendStore = create((set, get) => ({
  friends:        [],
  pendingRequests: [], // incoming requests
  isLoading:      false,

  // ── Fetch ──────────────────────────────────────────────────────────────────

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data });
    } catch (error) {
      console.log("Error fetching friends:", error.message);
    }
  },

  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ pendingRequests: res.data });
    } catch (error) {
      console.log("Error fetching friend requests:", error.message);
    }
  },

  // ── Actions ────────────────────────────────────────────────────────────────

  sendFriendRequest: async (receiverId) => {
    try {
      await axiosInstance.post(`/friends/request/${receiverId}`);
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const res = await axiosInstance.put(`/friends/request/${requestId}/accept`);
      const newFriend = res.data.sender; // populated sender from backend
      set({
        pendingRequests: get().pendingRequests.filter((r) => r._id !== requestId),
        friends: newFriend ? [...get().friends, newFriend] : get().friends,
      });
      // Also do a full refresh to stay in sync
      get().getFriends();
      toast.success("Friend request accepted!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept");
    }
  },

  rejectRequest: async (requestId) => {
    try {
      await axiosInstance.put(`/friends/request/${requestId}/reject`);
      set({
        pendingRequests: get().pendingRequests.filter((r) => r._id !== requestId),
      });
      toast.success("Request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    }
  },

  // ── Socket ─────────────────────────────────────────────────────────────────

  subscribeToFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove before re-adding to prevent duplicate listeners
    socket.off("friendRequestReceived");
    socket.off("friendRequestAccepted");

    socket.on("friendRequestReceived", (request) => {
      set({ pendingRequests: [...get().pendingRequests, request] });
      toast(`👤 ${request.sender.fullName} sent you a friend request`, {
        duration: 5000,
        icon: "👋",
      });
    });

    socket.on("friendRequestAccepted", ({ acceptedBy }) => {
      toast.success(`${acceptedBy.fullName} accepted your friend request!`);
      // Add to friends list immediately + refresh for accuracy
      set({ friends: [...get().friends, acceptedBy] });
      get().getFriends();
    });
  },

  unsubscribeFromFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("friendRequestReceived");
    socket?.off("friendRequestAccepted");
  },
}));