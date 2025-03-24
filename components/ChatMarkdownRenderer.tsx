import { Text, Heading, List } from '@/components/ui/typography';
import { SafeMarkdownRenderer } from './SafeMarkdownRenderer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export function ChatMarkdownRenderer({
  content,
  isUser,
}: ChatMarkdownRendererProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 w-full',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'rounded-lg p-4 max-w-[95%] w-fit',
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black',
        )}
      >
        <SafeMarkdownRenderer
          markdown={content}
          components={{
            h1: ({ children, ...props }) => (
              <Heading
                tag='h1'
                className={cn('pb-3', isUser && 'text-white')}
                {...props}
              >
                {children}
              </Heading>
            ),
            h2: ({ children, ...props }) => (
              <Heading
                tag='h2'
                className={cn('pb-3', isUser && 'text-white')}
                {...props}
              >
                {children}
              </Heading>
            ),
            h3: ({ children, ...props }) => (
              <Heading
                tag='h3'
                className={cn('pb-3', isUser && 'text-white')}
                {...props}
              >
                {children}
              </Heading>
            ),
            h4: ({ children, ...props }) => (
              <Heading
                tag='h4'
                variant='small'
                className={cn('pb-3', isUser && 'text-white')}
                {...props}
              >
                {children}
              </Heading>
            ),
            p: ({ children, ...props }) => (
              <Text
                className={cn(
                  'pb-3',
                  isUser ? 'text-white/90' : 'text-black/90',
                )}
                {...props}
              >
                {children}
              </Text>
            ),
            span: ({ children, ...props }) => (
              <Text
                tag='span'
                className={isUser ? 'text-white/90' : 'text-black/90'}
                {...props}
              >
                {children}
              </Text>
            ),
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                className={cn(
                  'hover:underline',
                  isUser ? 'text-white' : 'text-blue-600',
                )}
                target='_blank'
                rel='noopener noreferrer'
                {...props}
              >
                <Text tag='span'>{children}</Text>
              </a>
            ),
            ul: ({ children, ...props }) => (
              <List
                className={cn(
                  'pb-3',
                  isUser ? 'text-white/90' : 'text-black/90',
                )}
                {...props}
              >
                {children}
              </List>
            ),
            ol: ({ children, ...props }) => (
              <List
                variant='ordered'
                tag='ol'
                className={cn(
                  'pb-3',
                  isUser ? 'text-white/90' : 'text-black/90',
                )}
                {...props}
              >
                {children}
              </List>
            ),
            code: ({ children, ...props }) => (
              <code
                className={cn(
                  'rounded px-1.5 py-0.5 font-mono text-sm',
                  isUser ? 'bg-white/10 text-white' : 'bg-gray-300 text-black',
                )}
                {...props}
              >
                {children}
              </code>
            ),
            pre: ({ children, ...props }) => (
              <pre
                className={cn(
                  'rounded-lg p-4 my-4 overflow-x-auto font-mono text-sm',
                  isUser ? 'bg-white/10 text-white' : 'bg-gray-300 text-black',
                )}
                {...props}
              >
                {children}
              </pre>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote
                className={cn(
                  'border-l-2 pl-4 my-4 italic',
                  isUser
                    ? 'border-white/20 text-white/90'
                    : 'border-gray-400 text-black/90',
                )}
                {...props}
              >
                {children}
              </blockquote>
            ),
          }}
        />
      </div>
      <Button
        variant='ghost'
        size='sm'
        className={cn(
          'flex items-center gap-2 text-xs ml-2 transition-all duration-200',
          'text-gray-500 hover:text-gray-700',
          copied && 'bg-green-500/10',
        )}
        onClick={copyToClipboard}
      >
        {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  );
}
