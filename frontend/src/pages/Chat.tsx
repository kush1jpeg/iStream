import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  readBy: string[];
  isStreamer?: boolean;
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  type: "dm" | "group";
  name: string;
  avatar?: string;
  participants: string[];
  lastMessage?: string;
  lastActivity: Date;
  unreadCount: number;
  isOnline?: boolean;
  isLive?: boolean;
}

const Chat = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>("group-1");
  const currentUserId = "current-user";

  // Mock conversations
  const conversations: Conversation[] = [
    {
      id: "group-1",
      type: "group",
      name: "terminal_wizard's stream",
      participants: ["terminal_wizard", "pixel_fan", "retro_user", "vhs_collector"],
      lastMessage: "This stream is amazing!",
      lastActivity: new Date(),
      unreadCount: 3,
      isLive: true,
    },
    {
      id: "group-2",
      type: "group",
      name: "late_night_coders",
      participants: ["dev_master", "code_ninja", "byte_wizard"],
      lastMessage: "Anyone working on Rust?",
      lastActivity: new Date(Date.now() - 3600000),
      unreadCount: 0,
      isLive: false,
    },
    {
      id: "dm-1",
      type: "dm",
      name: "pixel_fan",
      participants: ["pixel_fan"],
      lastMessage: "Hey, love your content!",
      lastActivity: new Date(Date.now() - 1800000),
      unreadCount: 1,
      isOnline: true,
    },

  ];

  // Mock messages for active conversation
  const mockMessages: Record<string, Message[]> = {
    "group-1": [
      { id: "1", senderId: "terminal_wizard", senderName: "terminal_wizard", content: "Welcome to the stream everyone!", timestamp: new Date(Date.now() - 3600000), readBy: ["pixel_fan", "retro_user"], isStreamer: true },
      { id: "sys-1", senderId: "system", senderName: "SYSTEM", content: ">>> pixel_fan has joined the chat <<<", timestamp: new Date(Date.now() - 3500000), readBy: [], isSystem: true },
      { id: "2", senderId: "pixel_fan", senderName: "pixel_fan", content: "This stream is amazing!", timestamp: new Date(Date.now() - 3400000), readBy: ["terminal_wizard", "retro_user"] },
      { id: "3", senderId: "retro_user", senderName: "retro_user", content: "Love the analog vibes", timestamp: new Date(Date.now() - 3300000), readBy: ["terminal_wizard", "pixel_fan"] },
      { id: "4", senderId: "terminal_wizard", senderName: "terminal_wizard", content: "Building a retro terminal emulator in Rust today", timestamp: new Date(Date.now() - 3200000), readBy: ["pixel_fan"], isStreamer: true },
      { id: "sys-2", senderId: "system", senderName: "SYSTEM", content: ">>> vhs_collector has joined the chat <<<", timestamp: new Date(Date.now() - 3100000), readBy: [], isSystem: true },
      { id: "5", senderId: "vhs_collector", senderName: "vhs_collector", content: "Reminds me of old broadcasts", timestamp: new Date(Date.now() - 3000000), readBy: ["terminal_wizard"] },
      { id: "6", senderId: "pixel_fan", senderName: "pixel_fan", content: "What font are you using?", timestamp: new Date(Date.now() - 2900000), readBy: [] },
      { id: "7", senderId: "terminal_wizard", senderName: "terminal_wizard", content: "VT323 for the terminal, Press Start 2P for headers", timestamp: new Date(Date.now() - 2800000), readBy: [], isStreamer: true },
    ],
    "dm-1": [
      { id: "dm1-1", senderId: "pixel_fan", senderName: "pixel_fan", content: "Hey! Really enjoy your streams", timestamp: new Date(Date.now() - 86400000), readBy: ["current-user"] },
      { id: "dm1-2", senderId: "current-user", senderName: "you", content: "Thanks! Appreciate the support", timestamp: new Date(Date.now() - 85000000), readBy: ["pixel_fan"] },
      { id: "dm1-3", senderId: "pixel_fan", senderName: "pixel_fan", content: "When's your next retro coding stream?", timestamp: new Date(Date.now() - 3600000), readBy: ["current-user"] },
      { id: "dm1-4", senderId: "current-user", senderName: "you", content: "Tomorrow at 8PM EST!", timestamp: new Date(Date.now() - 3500000), readBy: ["pixel_fan"] },
      { id: "dm1-5", senderId: "pixel_fan", senderName: "pixel_fan", content: "Hey, love your content!", timestamp: new Date(Date.now() - 1800000), readBy: [] },
    ],
  };

  const activeConvo = conversations.find(c => c.id === activeConversation);
  const messages = activeConversation ? mockMessages[activeConversation] || [] : [];

  return (
    <div className="min-h-screen bg-[#101010] crt-container film-grain">
      {/* <Sidebar followedUsers={} /> */}
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-4">
            <ChatSidebar
              conversations={conversations}
              activeId={activeConversation}
              onSelect={setActiveConversation}
            />
          </div>

          {/* Main Chat Window */}
          <div className="lg:col-span-8">
            <ChatWindow
              conversation={activeConvo}
              messages={messages}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;

