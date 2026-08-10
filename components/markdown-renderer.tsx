import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-prose w-full break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }: any) => <p className="leading-relaxed mb-4 last:mb-0 text-inherit" {...props} />,
          a: ({ node, ...props }: any) => <a className="text-[#F26522] hover:underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({ node, ...props }: any) => <strong className="font-bold text-inherit" {...props} />,
          em: ({ node, ...props }: any) => <em className="italic text-inherit" {...props} />,
          ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-inherit" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-inherit" {...props} />,
          li: ({ node, ...props }: any) => <li className="text-sm text-inherit" {...props} />,
          table: ({ node, ...props }: any) => (
            <div className="overflow-x-auto mb-4 w-full">
              <table className="w-full text-left border-collapse border border-border rounded-lg text-sm" {...props} />
            </div>
          ),
          th: ({ node, ...props }: any) => <th className="bg-secondary/80 px-4 py-2 border border-border font-bold text-navy uppercase tracking-wider" {...props} />,
          td: ({ node, ...props }: any) => <td className="px-4 py-2 border border-border text-navy/80" {...props} />,
          h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-navy mb-4 mt-6" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-navy mb-3 mt-5" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-navy mb-2 mt-4" {...props} />,
          blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-[#F26522] pl-4 italic bg-secondary/30 py-2 pr-4 rounded-r-lg mb-4 text-navy/70" {...props} />,
          code: ({ node, ...props }: any) => <code className="bg-secondary/50 text-[#F26522] px-1.5 py-0.5 rounded-md font-mono text-sm border border-border/50" {...props} />,
          pre: ({ node, ...props }: any) => <pre className="bg-navy text-white p-4 rounded-xl overflow-x-auto mb-4 font-mono text-sm shadow-inner" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
