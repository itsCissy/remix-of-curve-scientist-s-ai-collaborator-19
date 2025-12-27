import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const CopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && !String(children).includes("\n");
            
            if (match) {
              return (
                <div className="group relative my-3 rounded-lg overflow-hidden border border-border/50">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {match[1]}
                    </span>
                  </div>
                  <CopyButton code={codeString} />
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className="block px-4 py-3 rounded-lg bg-muted text-foreground font-mono text-sm overflow-x-auto"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/50">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b border-border/50">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 text-foreground border-b border-border/30">
                {children}
              </td>
            );
          },
          tr({ children }) {
            return <tr className="hover:bg-muted/30 transition-colors">{children}</tr>;
          },
          ul({ children }) {
            return <ul className="my-2 ml-4 list-disc space-y-1.5 marker:text-primary">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2 ml-4 list-decimal space-y-1.5 marker:text-primary">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-foreground leading-relaxed pl-1">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
          },
          p({ children }) {
            return <p className="my-2 leading-relaxed text-foreground">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 pl-4 border-l-4 border-primary/50 bg-muted/30 py-2 pr-4 rounded-r-lg italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-4 border-border/50" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
