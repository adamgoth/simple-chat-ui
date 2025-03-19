import ReactMarkdown, { Components } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface SafeMarkdownRendererProps {
  markdown: string;
  components?: Components;
}

export function SafeMarkdownRenderer({
  markdown,
  components,
}: SafeMarkdownRendererProps) {
  return (
    <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}
