import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  Search,
  Bot,
  ChevronDown,
  Plus,
  User,
  Square,
  AlertCircle,
  Check,
} from "lucide-react";
import AIResponse from "../components/AIResponse";
import { useChat } from "../context/ChatContext";
import { fetchChat, fetchModels, getChatStreamUrl } from "../services/chat";

function NewChat() {
  const { activeChatId, selectChat, refreshChats, userId } = useChat();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Auto");
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableModels, setAvailableModels] = useState(["Auto", "qwen3:4b"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const animationFrameRef = useRef(null);

  /**
   * localChatIdRef tracks the current active chat for THIS component instance.
   * It is separate from the context's activeChatId so that sending a first message
   * does not trigger a backend re-fetch of the chat (which would wipe in-progress
   * streaming content).
   *
   * Rule:
   *   - Set to a new ID when user sends first message in a blank session.
   *   - Synced to activeChatId when user clicks a chat in the sidebar.
   *   - Reset to null when user clicks "New Chat".
   */
  const localChatIdRef = useRef(null);

  /**
   * When this flag is set to a chat_id, the next activeChatId useEffect trigger
   * will skip the backend fetch (because we just registered a chat we already have
   * in local state). It resets itself after one skip.
   */
  const skipNextLoadRef = useRef(null);

  const hasMessages = messages.length > 0;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const smoothScrollToBottom = useCallback(() => {
    if (animationFrameRef.current) return;
    animationFrameRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      animationFrameRef.current = null;
    });
  }, []);

  /**
   * Map a backend message row to the frontend message shape.
   */
  const mapBackendMessage = (m) => ({
    id: m.id,
    role: m.role,
    content: m.content || "",
    thinking: m.thinking || "",
    thinkDuration: m.think_duration || 0,
    isThinking: false,
    isGenerating: false,
    timestamp: m.created_at,
  });

  // -------------------------------------------------------------------------
  // Fetch available models on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await fetchModels();
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          setSelectedModel((current) =>
            data.models.includes(current) ? current : data.models[0]
          );
        }
        setBackendError(null);
      } catch (err) {
        console.warn("Backend not reachable:", err);
        setBackendError("Backend server is offline or unreachable.");
      }
    };
    loadModels();
  }, []);

  // -------------------------------------------------------------------------
  // Load chat from backend when activeChatId changes (sidebar click or reset)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Sync the local ref
    localChatIdRef.current = activeChatId;

    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Skip backend fetch if we just registered this chat ourselves
    if (skipNextLoadRef.current === activeChatId) {
      skipNextLoadRef.current = null;
      return;
    }

    const loadChat = async () => {
      try {
        const data = await fetchChat(activeChatId);
        if (data.chat && data.chat.messages) {
          setMessages(data.chat.messages.map(mapBackendMessage));
          if (data.chat.model) setSelectedModel(data.chat.model);
          setTimeout(smoothScrollToBottom, 50);
        }
      } catch (err) {
        console.error("Failed to load chat:", err);
      }
    };

    loadChat();
  }, [activeChatId, smoothScrollToBottom]);

  // Scroll to bottom on every message update
  useEffect(() => {
    smoothScrollToBottom();
  }, [messages, smoothScrollToBottom]);

  // -------------------------------------------------------------------------
  // Stop generation
  // -------------------------------------------------------------------------
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((msg, index) =>
        index === prev.length - 1 && msg.role === "assistant"
          ? { ...msg, isGenerating: false, isThinking: false }
          : msg
      )
    );
  };

  // -------------------------------------------------------------------------
  // Send message — core chat flow
  // -------------------------------------------------------------------------
  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isGenerating) return;

    // Resolve or create the chat session ID locally (does NOT touch context yet)
    if (!localChatIdRef.current) {
      localChatIdRef.current = `chat_${Date.now()}`;
    }
    const chatId = localChatIdRef.current;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    
    const assistantId = Date.now() + 1;
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: "",
      isThinking: true,
      isGenerating: true,
      thinkDuration: 0,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setMessage("");
    
    setIsGenerating(true);
    setBackendError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const thinkStartTime = Date.now();
    let thinkEndTime = null;

    try {
      const imageBase64 = selectedImage
      ? await fileToBase64(selectedImage)
      : null;

      const response = await fetch(getChatStreamUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          model: selectedModel,
          stream: true,
          chat_id: chatId,
          user_id: userId,
          images: imageBase64 ? [imageBase64] : null,
        }),
        signal: controller.signal,
      });

      setSelectedImage(null);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedThinking = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const data = JSON.parse(jsonStr);

            if (data.type === "routing") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, routing: data.data }
                    : msg
                )
              );
            } else if (data.type === "thinking") {
              accumulatedThinking += data.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, thinking: accumulatedThinking, isThinking: true }
                    : msg
                )
              );
            } else if (data.type === "content") {
              if (!thinkEndTime) {
                thinkEndTime = ((Date.now() - thinkStartTime) / 1000).toFixed(1);
              }
              accumulatedContent += data.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        isThinking: false,
                        thinkDuration: thinkEndTime,
                      }
                    : msg
                )
              );
            } else if (data.type === "done") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, isThinking: false, isGenerating: false }
                    : msg
                )
              );
            } else if (data.type === "error") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content:
                          (msg.content || "") + `\n\n> ⚠️ **Error:** ${data.error}`,
                        isThinking: false,
                        isGenerating: false,
                      }
                    : msg
                )
              );
            }
          } catch (jsonErr) {
            console.warn("Error parsing stream chunk:", jsonErr);
          }
        }
      }

      // Backend has already persisted the messages (user + assistant).
      // Just refresh the sidebar and register the chat in context.
      await refreshChats();

      // Sync context without triggering a backend reload of this chat
      if (activeChatId !== chatId) {
        skipNextLoadRef.current = chatId;
        selectChat(chatId);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by user.");
      } else {
        console.error("Chat error:", err);
        const errorMsg = `\n\n> ⚠️ **Connection Error:** Could not reach the backend.\n> Make sure \`py backend/main.py\` is running.`;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: (msg.content || "") + errorMsg,
                  isThinking: false,
                  isGenerating: false,
                }
              : msg
          )
        );
        setBackendError("Backend server is offline or unreachable.");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        // Remove "data:image/...;base64," prefix
        const base64 = result.split(",")[1];

        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    if (isGenerating) stopGeneration();
    localChatIdRef.current = null;
    selectChat(null);
    setMessages([]);
    setMessage("");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <div className="flex h-full w-full flex-col min-h-0 overflow-hidden relative">
      {/* Backend Status Warning */}
      {backendError && (
        <div className="mx-6 mt-3 shrink-0 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-400" />
            <span>FastAPI Backend is currently unreachable.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-300/80">
            Run: py backend/main.py
          </span>
        </div>
      )}

      {/* Empty State */}
      {!hasMessages && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 overflow-y-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#293440] bg-[#111820]">
            <Sparkles size={21} strokeWidth={1.8} className="text-gray-200" />
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-gray-600">
            Sovereign AI Workbench
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl text-center">
            What would you like to work on?
          </h1>

          <p className="mt-3 max-w-xl text-center text-sm leading-6 text-gray-500">
            Ask questions, reason step by step, and generate code with local
            models. Chats are saved automatically.
          </p>

          <div className="mt-8 w-full max-w-3xl">
            <ChatComposer
              message={message}
              setMessage={setMessage}
              onSend={sendMessage}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage} 
              onKeyDown={handleKeyDown}
              knowledgeEnabled={knowledgeEnabled}
              setKnowledgeEnabled={setKnowledgeEnabled}
              textareaRef={textareaRef}
              isGenerating={isGenerating}
              onStop={stopGeneration}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              availableModels={availableModels}
            />
          </div>
        </div>
      )}

      {/* Scrollable Conversation Window */}
      {hasMessages && (
        <>
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-8"
          >
            {/* Widen max content width for better readability */}
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 ${
                    item.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {item.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#26313D] bg-[#111820]">
                      <Sparkles size={15} className="text-gray-300" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl text-sm leading-6 transition-all ${
                      item.role === "user"
                        ? "max-w-[70%] bg-white px-4 py-3 text-black font-medium"
                        : "flex-1 min-w-0 border border-[#202934] bg-[#0E141A] px-5 py-4 text-gray-300 shadow-lg shadow-black/20"
                    }`}
                  >
                    {item.role === "user" ? (
                      item.content
                    ) : (
                      <AIResponse
                        content={item.content}
                        thinking={item.thinking}
                        isThinking={item.isThinking}
                        isGenerating={item.isGenerating}
                        thinkDuration={item.thinkDuration}
                        routing={item.routing}
                      />
                    )}
                  </div>

                  {item.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#26313D]">
                      <User size={15} className="text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Bottom Composer */}
          <div className="shrink-0 border-t border-[#202934] bg-[#080C11] px-4 py-4 sm:px-8 z-10">
            <div className="mx-auto max-w-4xl">
              <ChatComposer
                message={message}
                setMessage={setMessage}
                onSend={sendMessage}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                onKeyDown={handleKeyDown}
                knowledgeEnabled={knowledgeEnabled}
                setKnowledgeEnabled={setKnowledgeEnabled}
                textareaRef={textareaRef}
                isGenerating={isGenerating}
                onStop={stopGeneration}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                availableModels={availableModels}
              />

              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="flex items-center gap-1.5 text-[11px] text-gray-500 transition hover:text-gray-300"
                >
                  <Plus size={13} />
                  New conversation
                </button>

                <p className="text-[10px] text-gray-600">
                  Enter to send · Shift + Enter for new line · Auto-saved
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChatComposer({
  message,
  setMessage,
  onSend,
  selectedImage,
  setSelectedImage,
  onKeyDown,
  knowledgeEnabled,
  setKnowledgeEnabled,
  textareaRef,
  isGenerating,
  onStop,
  selectedModel,
  setSelectedModel,
  availableModels,
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="rounded-2xl border border-[#293440] bg-[#0E141A] p-3 shadow-2xl shadow-black/20 transition focus-within:border-[#3A4654]">
      
      {selectedImage && imagePreview && (
          <div className="mb-2 flex items-center gap-2">
            <img
              src={imagePreview}
              alt="Selected"
              className="h-16 w-16 rounded-lg object-cover border border-[#293440]"
            />

            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-200"
            >
              Remove
            </button>
          </div>
        )}

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder="Ask anything... (e.g. 'Solve 25 * 16 step by step')"
        className="w-full resize-none bg-transparent px-3 py-1.5 text-sm leading-6 text-gray-200 outline-none placeholder:text-gray-600"
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 transition hover:bg-[#151C24] hover:text-gray-200"
>
  <Paperclip size={14} />
  Attach
</button>

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  }}
/>

          <button
            type="button"
            onClick={() => setKnowledgeEnabled(!knowledgeEnabled)}
            className={`hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition sm:flex ${
              knowledgeEnabled
                ? "bg-[#18212B] text-gray-200"
                : "text-gray-500 hover:bg-[#151C24] hover:text-gray-200"
            }`}
          >
            <Search size={14} />
            Knowledge
          </button>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 transition hover:bg-[#151C24] hover:text-gray-200 sm:flex"
          >
            <Bot size={14} />
            Agent
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="hidden items-center gap-2 rounded-lg border border-[#202934] bg-[#111820] px-3 py-1.5 text-xs text-gray-400 transition hover:border-[#303B48] hover:text-gray-200 sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs">{selectedModel}</span>
              <ChevronDown size={13} />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl border border-[#253242] bg-[#0c1218] p-1 shadow-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-gray-500">
                  Ollama Models
                </div>
                {availableModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedModel(m);
                      setModelDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                      selectedModel === m
                        ? "bg-[#182330] text-sky-300 font-medium"
                        : "text-gray-400 hover:bg-[#121a24] hover:text-gray-200"
                    }`}
                  >
                    <span className="truncate">{m}</span>
                    {selectedModel === m && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95 transition"
              title="Stop generating"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!message.trim() && !selectedImage}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                message.trim() || selectedImage
                  ? "bg-white text-black hover:bg-gray-200 active:scale-95"
                  : "bg-[#202934] text-gray-600"
              }`}
              title="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewChat;
