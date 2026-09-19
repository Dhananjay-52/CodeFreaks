import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchChats, deleteChat } from "../services/chat";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);

  const userId = user?.id || "default";

  const refreshChats = useCallback(async () => {
    if (!userId) return;
    setLoadingChats(true);
    try {
      const data = await fetchChats(userId);
      setChats(data.chats || []);
    } catch (err) {
      console.warn("Could not fetch chat history:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [userId]);

  // Load sidebar on mount and whenever the authenticated user changes
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  /**
   * Select a chat from the sidebar (triggers message load in NewChat).
   */
  const selectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  /**
   * Reset to a blank new-chat state.
   * Only called by the explicit "New Chat" button.
   */
  const createNewChat = () => {
    setActiveChatId(null);
  };

  const deleteChatSession = async (chatId) => {
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.chat_id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        loadingChats,
        refreshChats,
        selectChat,
        createNewChat,
        deleteChatSession,
        userId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
