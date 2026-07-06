/**
 * Markdown - renders an article body in Praeco's editorial voice. Used both in
 * the Studio's live preview and on the reader page, so what a writer sees while
 * writing is exactly what a reader gets. Raw HTML is NOT rendered (react-markdown
 * is safe by default), so pasted markup can't inject scripts.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="font-serif text-lg leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="mt-8 mb-3 font-display text-3xl font-semibold text-ink" {...props} />,
          h2: (props) => <h2 className="mt-8 mb-3 font-display text-2xl font-semibold text-ink" {...props} />,
          h3: (props) => <h3 className="mt-6 mb-2 font-display text-xl font-semibold text-ink" {...props} />,
          p: (props) => <p className="my-4" {...props} />,
          a: (props) => <a className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer" {...props} />,
          ul: (props) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
          ol: (props) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
          blockquote: (props) => (
            <blockquote className="my-6 border-l-2 border-primary/50 pl-4 italic text-muted-foreground" {...props} />
          ),
          code: (props) => (
            <code className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-ink" {...props} />
          ),
          pre: (props) => (
            <pre className="my-5 overflow-x-auto rounded-md border border-border bg-secondary/50 p-4 font-mono text-sm" {...props} />
          ),
          hr: () => <hr className="my-8 border-border" />,
          // eslint-disable-next-line @next/next/no-img-element
          img: (props) => <img className="my-6 w-full rounded-md border border-border" alt={props.alt ?? ""} {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
