import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  isUser: boolean;
}

export function MarkdownMessage({ content, isUser }: MarkdownMessageProps) {
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      <div
        className={cn(
          'rounded-lg p-4 max-w-[80%] overflow-x-auto relative group',
          'prose prose-sm max-w-none',
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black',
          isUser && [
            'prose-headings:text-white',
            'prose-p:text-white/90',
            'prose-strong:text-white',
            'prose-code:text-white prose-code:bg-white/10',
            'prose-pre:bg-white/10 prose-pre:shadow-md',
            'prose-blockquote:border-white/20 prose-blockquote:bg-white/10',
            'prose-a:text-white prose-a:underline',
            'prose-li:text-white/90',
            'prose-hr:border-white/20',
            'prose-th:text-white prose-th:bg-white/10',
            'prose-td:text-white/90 prose-td:border-white/20',
          ],
          !isUser && [
            'prose-code:bg-gray-300',
            'prose-pre:bg-gray-300 prose-pre:shadow-md',
            'prose-blockquote:border-gray-400 prose-blockquote:bg-gray-300',
            'prose-th:bg-gray-300',
          ],
        )}
      >
        <Button
          size='icon'
          variant='ghost'
          className={cn(
            'absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity duration-200',
            showCopy && 'opacity-100',
            isUser
              ? 'text-white hover:text-white/80'
              : 'text-gray-500 hover:text-gray-700',
          )}
          onClick={handleCopy}
        >
          <Copy className='h-4 w-4' />
          {copied && (
            <span className='absolute -top-8 right-0 text-xs bg-black text-white px-2 py-1 rounded shadow-md'>
              Copied!
            </span>
          )}
        </Button>
        <ReactMarkdown
          remarkPlugins={[remarkParse, remarkRehype]}
          rehypePlugins={[rehypeSanitize, rehypeStringify]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
