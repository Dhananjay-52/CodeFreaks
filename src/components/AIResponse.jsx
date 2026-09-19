import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal } from "lucide-react";
import ThinkingBlock from "./ThinkingBlock";

// Code block with syntax styling, language badge, and copy button
function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (inline) {
    return (
      <code
        className="rounded bg-[#18222e] px-1.5 py-0.5 font-mono text-[13px] font-medium text-sky-300 border border-[#2a3848]"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-[#253242] bg-[#0A0E14] text-xs shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1c2736] bg-[#101721] px-4 py-2 text-gray-400">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-gray-500" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            {language || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-gray-400 transition hover:bg-[#1a2533] hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-gray-200 selection:bg-sky-900/50">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

function AIResponse({
  content = "",
  thinking = "",
  isThinking = false,
  isGenerating = false,
  thinkDuration = 0,
}) {
  return (
    <div className="ai-response-container w-full">
      {/* Real-time Thinking Block */}
      {(thinking || isThinking) && (
        <ThinkingBlock
          thinking={thinking}
          isThinking={isThinking}
          thinkDuration={thinkDuration}
        />
      )}

      {/* Main Markdown Response Content */}
      <div className="prose prose-invert prose-slate max-w-none text-sm leading-7 text-gray-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock,
            h1: ({ children }) => (
              <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-white border-b border-[#253242] pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-5 text-xl font-semibold tracking-tight text-gray-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-200">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="mb-2 mt-3 text-base font-semibold text-gray-200">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="mb-3.5 leading-7 text-gray-300 last:mb-0">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="my-3 ml-5 list-disc space-y-1.5 text-gray-300 marker:text-sky-400">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-3 ml-5 list-decimal space-y-1.5 text-gray-300 marker:text-sky-400 font-medium">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-6">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="my-3.5 border-l-2 border-indigo-400 bg-indigo-500/5 px-4 py-2.5 rounded-r-lg italic text-gray-300">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 underline underline-offset-4 transition hover:text-sky-300"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto rounded-xl border border-[#263242]">
                <table className="w-full text-left text-xs border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-[#121a24] text-gray-200 font-semibold border-b border-[#263242]">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-[#1e2835] bg-[#0c1218]">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="transition hover:bg-[#131d27]">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-300">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2.5 text-xs text-gray-300">{children}</td>
            ),
            hr: () => <hr className="my-6 border-[#202c3b]" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>

        {/* Pulsing cursor while generating tokens */}
        {isGenerating && !isThinking && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-sky-400 align-middle" />
        )}
      </div>
    </div>
  );
}

export default AIResponse;
