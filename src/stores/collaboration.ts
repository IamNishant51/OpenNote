import { create } from "zustand";
import type { Share, Notification } from "@/types/comments";

interface CollaborationState {
  wsUrl: string;
  userName: string;
  userColor: string;
  connected: boolean;
  peers: number;
  notificationsOpen: boolean;
  sharingOpen: boolean;
  shares: Share[];
  notifications: Notification[];

  setWsUrl: (url: string) => void;
  setUserName: (name: string) => void;
  setUserColor: (color: string) => void;
  setConnected: (v: boolean) => void;
  setPeers: (n: number) => void;
  setNotificationsOpen: (v: boolean) => void;
  setSharingOpen: (v: boolean) => void;
  setShares: (s: Share[]) => void;
  addShare: (s: Share) => void;
  removeShare: (id: string) => void;
  setNotifications: (n: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useCollabStore = create<CollaborationState>((set) => ({
  wsUrl: "ws://localhost:1234",
  userName: "Anonymous",
  userColor: "#0075de",
  connected: false,
  peers: 0,
  notificationsOpen: false,
  sharingOpen: false,
  shares: [],
  notifications: [],

  setWsUrl: (wsUrl) => set({ wsUrl }),
  setUserName: (userName) => set({ userName }),
  setUserColor: (userColor) => set({ userColor }),
  setConnected: (connected) => set({ connected }),
  setPeers: (peers) => set({ peers }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  setSharingOpen: (sharingOpen) => set({ sharingOpen }),
  setShares: (shares) => set({ shares }),
  addShare: (share) => set((s) => ({ shares: [...s.shares, share] })),
  removeShare: (id) => set((s) => ({ shares: s.shares.filter((x) => x.id !== id) })),
  setNotifications: (notifications) => set({ notifications }),
  markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));
