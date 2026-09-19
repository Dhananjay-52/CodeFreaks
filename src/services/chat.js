import { API_BASE, apiFetch } from "./api";

/**
 * Fetch all chats for the sidebar.
 * @returns {Promise<{chats: Array}>}
 */
export async function fetchChats(userId) {
  const res = await apiFetch(`/api/chats?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch chats.");
  return res.json();
}

/**
 * Fetch a single chat with its messages.
 * @returns {Promise<{chat: Object}>}
 */
export async function fetchChat(chatId) {
  const res = await apiFetch(`/api/chats/${encodeURIComponent(chatId)}`);
  if (!res.ok) throw new Error("Chat not found.");
  return res.json();
}

/**
 * Delete a chat.
 */
export async function deleteChat(chatId) {
  const res = await apiFetch(`/api/chats/${encodeURIComponent(chatId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete chat.");
  return res.json();
}

/**
 * Fetch available Ollama models.
 * @returns {Promise<{models: string[]}>}
 */
export async function fetchModels() {
  const res = await apiFetch("/api/models");
  if (!res.ok) throw new Error("Failed to fetch models.");
  return res.json();
}

/**
 * Returns the full URL for the streaming chat endpoint.
 * The caller is responsible for opening a fetch/ReadableStream.
 */
export function getChatStreamUrl() {
  return `${API_BASE}/api/chat`;
}
