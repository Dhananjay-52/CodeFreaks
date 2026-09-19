import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

export default function ThinkingBlock({
  thinking = "",
  isThinking = false,
  thinkDuration = 0,
}) {
  const [isOpen, setIsOpen] = useState(isThinking);
  const [elapsedTime, setElapsedTime] = useState(thinkDuration || 0);

  // Timer while thinking
  useEffect(() => {
    let interval;
    if (isThinking) {
      setIsOpen(true);
      const startTime = Date.now() - (elapsedTime * 1000);
      interval = setInterval(() => {
        setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);
    } else if (thinkDuration) {
      setElapsedTime(thinkDuration);
    }
    return () => clearInterval(interval);
  }, [isThinking, thinkDuration]);

  // When thinking completes, keep open if desired or let user toggle
  if (!thinking && !isThinking) {
    return null;
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#232f3e] bg-[#0c1219]/90 text-xs shadow-sm transition-all duration-200">
      {/* Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-gray-400 transition hover:bg-[#131c26] hover:text-gray-200"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <div className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
              <Sparkles size={14} className="relative text-indigo-300 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
          ) : (
            <Brain size={14} className="text-gray-400" />
          )}

          <span className="font-medium">
            {isThinking
              ? `Thinking... (${elapsedTime}s)`
              : `Thought process (${elapsedTime > 0 ? `${elapsedTime}s` : "complete"})`}
          </span>

          {isThinking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
              Reasoning in progress
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-[11px]">{isOpen ? "Hide" : "Show"}</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-[#1c2633] bg-[#080d12] p-3.5">
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-gray-400 selection:bg-indigo-900/40">
            {thinking || (
              <span className="italic text-gray-600">
                Formulating plan and reasoning steps...
              </span>
            )}
            {isThinking && (
              <span className="inline-block h-3.5 w-1.5 ml-1 animate-pulse bg-indigo-400 align-middle" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
