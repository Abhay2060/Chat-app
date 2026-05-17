import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  selectedUser:    null,   // the friend currently open in chat window
  activeTab:       "chats", // "chats" | "contacts"
  messages:        [],     // messages in the current conversation
  chats:           [],     // list of users you have existing conversations with
  allContacts:     [],     // all users (used by ContactList)
  isMessagesLoading: false,
  isUsersLoading:    false,
  isSoundEnabled:    true,

  // ── Tab & User Selection ───────────────────────────────────────────────────

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (user) => {
    // If same user clicked again — do nothing, keep messages intact
    if (get().selectedUser?._id === user?._id) return;
    set({ selectedUser: user, messages: [] });
  },

  // ── Fetch chat partners (users you've already messaged) ───────────────────

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ── Fetch all contacts (every user except yourself) ───────────────────────

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ── Fetch messages between logged-in user and selectedUser ────────────────

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ── Send a message ────────────────────────────────────────────────────────

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ── React to a message ────────────────────────────────────────────────────

  reactToMessage: async (messageId, emoji) => {
    try {
      const userId = useAuthStore.getState().authUser._id;

      // Optimistic update
      const updatedMessages = get().messages.map((msg) => {
        if (msg._id !== messageId) return msg;
        const reactions = JSON.parse(JSON.stringify(msg.reactions || {}));

        let previousEmoji = null;
        for (const [key, users] of Object.entries(reactions)) {
          if (users.includes(userId)) { previousEmoji = key; break; }
        }
        for (const key of Object.keys(reactions)) {
          reactions[key] = reactions[key].filter((id) => id !== userId);
        }
        if (previousEmoji !== emoji) {
          reactions[emoji] = [...(reactions[emoji] || []), userId];
        }
        return { ...msg, reactions };
      });

      set({ messages: updatedMessages });

      const res = await axiosInstance.post(`/messages/${messageId}/react`, { emoji });

      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        ),
      });
    } catch (error) {
      toast.error("Failed to react");
    }
  },

  // ── Sound toggle ──────────────────────────────────────────────────────────

  toggleSound: () => set({ isSoundEnabled: !get().isSoundEnabled }),

  // ── Socket subscriptions ──────────────────────────────────────────────────

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageReacted");

    // New incoming message
    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      // Only add if it's from the currently open conversation
      const isFromSelected =
        newMessage.senderId === selectedUser?._id ||
        newMessage.senderId?._id === selectedUser?._id;
      if (!isFromSelected) return;
      set({ messages: [...get().messages, newMessage] });
    });

    // Reaction update
    socket.on("messageReacted", ({ messageId, reactions }) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("messageReacted");
  },
}));