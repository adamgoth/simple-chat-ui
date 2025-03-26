'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Message, Conversation } from '@/types/chat';
import { ChatMarkdownRenderer } from '@/components/ChatMarkdownRenderer';
import { useEnvKey } from '@/hooks/useEnvKey';
import { Loader2 } from 'lucide-react';
import { ConversationTitle } from '@/components/ConversationTitle';

const OPENROUTER_MODELS = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4 Mini',
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
  },
  {
    id: 'qwen/qwq-32b:free',
    name: 'Qwen 32B',
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct',
    name: 'Qwen 2.5 7B',
  },
] as const;

export default function ChatPage() {
  const [modelType, setModelType] = useState<'ollama' | 'openrouter'>('ollama');
  const [model, setModel] = useState<string>('llama2');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simplified hook usage
  const { hasKey: hasOpenRouterKey } = useEnvKey('OPENROUTER_API_KEY');

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // If OpenRouter is selected but there's no key, switch to Ollama
  useEffect(() => {
    if (modelType === 'openrouter' && !hasOpenRouterKey) {
      setModelType('ollama');
      setModel('');
    }
  }, [modelType, hasOpenRouterKey]);

  // Fetch Ollama models on component mount and when switching to Ollama
  useEffect(() => {
    const fetchOllamaModels = async () => {
      try {
        const response = await fetch('/api/ollama-models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        const modelNames =
          data.models?.map((model: { name: string }) => model.name) || [];
        setOllamaModels(modelNames);

        // Only set default model if we don't have one selected yet
        if (modelNames.length > 0 && (!model || modelType === 'ollama')) {
          setModel(modelNames[0]);
        }
      } catch (error) {
        console.error('Error fetching Ollama models:', error);
      }
    };

    // Fetch on mount or when switching to Ollama
    if (modelType === 'ollama') {
      fetchOllamaModels();
    }
  }, [modelType]); // Remove model from dependencies to prevent the cycle

  // Sync messages with current conversation
  useEffect(() => {
    if (currentConversationId) {
      const fetchConversation = async () => {
        try {
          const response = await fetch(
            `/api/conversations/${currentConversationId}`,
          );
          if (!response.ok) throw new Error('Failed to fetch conversation');
          const data = await response.json();
          if (data.messages) {
            setMessages(data.messages);
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      };

      fetchConversation();
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const updateConversationMessages = (newMessages: Message[]) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: newMessages }
          : conv,
      ),
    );
    setMessages(newMessages);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear input immediately
    setInput('');

    let conversationId = currentConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Conversation ${conversations.length + 1}`,
            model: model,
            llm: modelType,
          }),
        });

        if (!response.ok) throw new Error('Failed to create conversation');
        const data = await response.json();
        conversationId = data.conversation.id;
        setCurrentConversationId(conversationId);
        setConversations((prev) => [...prev, data.conversation]);
      } catch (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to create conversation');
        return;
      }
    }

    // Ensure we have a valid conversation ID
    if (!conversationId) {
      alert('Failed to create or find conversation');
      return;
    }

    // Create the message
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      model: model,
      llm: modelType,
      conversation_id: conversationId,
    };

    // Save the message
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMessage),
        },
      );

      if (!response.ok) throw new Error('Failed to save message');
      const data = await response.json();
      setMessages(data.messages);

      // Now send the message to the AI
      if (!model) {
        throw new Error('Please select a model first');
      }

      const aiResponse = await fetch(
        modelType === 'openrouter'
          ? '/api/chat-openrouter'
          : '/api/chat-ollama',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: data.messages,
            model: model,
          }),
        },
      );

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiData = await aiResponse.json();

      // Save AI's response
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiData.content || aiData.message,
        model: model,
        llm: modelType,
        conversation_id: conversationId,
      };

      const saveResponse = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assistantMessage),
        },
      );

      if (!saveResponse.ok) throw new Error('Failed to save AI response');
      const finalData = await saveResponse.json();
      setMessages(finalData.messages);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const event = new Event('submit') as any;
        handleFormSubmit(event);
      }
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Conversation ${conversations.length + 1}`,
          model: model,
          llm: modelType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      setConversations((prev) => [...prev, data.conversation]);
      setCurrentConversationId(data.conversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    }
  };

  const selectConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      setCurrentConversationId(conversationId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      alert('Failed to load conversation');
    }
  };

  const handleTitleChange = (conversationId: number, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv,
      ),
    );
  };

  return (
    <div className='container mx-auto max-w-6xl pt-10 flex'>
      <div className='w-1/4 pr-4'>
        <Card className='h-[calc(100vh-5rem)] overflow-y-auto'>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={createNewConversation} className='w-full mb-4'>
              New Conversation
            </Button>
            {conversations.map((conversation) => (
              <ConversationTitle
                key={conversation.id}
                id={conversation.id}
                title={conversation.title}
                onTitleChange={handleTitleChange}
                isSelected={currentConversationId === conversation.id}
                onClick={() => selectConversation(conversation.id)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className='w-3/4'>
        <Card className='h-[calc(100vh-5rem)] flex flex-col'>
          <CardHeader>
            <CardTitle>Chatbot UI</CardTitle>
            <div className='flex gap-4'>
              <Select
                value={modelType}
                onValueChange={(value: 'ollama' | 'openrouter') => {
                  if (value === 'openrouter' && !hasOpenRouterKey) {
                    return;
                  }
                  setModelType(value);
                  // Reset model selection when switching types
                  setModel('');
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Select model type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ollama'>Ollama</SelectItem>
                  <SelectItem value='openrouter' disabled={!hasOpenRouterKey}>
                    <div className='flex items-center justify-between w-full'>
                      <span>OpenRouter</span>
                      {!hasOpenRouterKey && (
                        <span className='text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded-full'>
                          add key
                        </span>
                      )}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Select model' />
                </SelectTrigger>
                <SelectContent>
                  {modelType === 'ollama'
                    ? ollamaModels.map((modelName) => (
                        <SelectItem key={modelName} value={modelName}>
                          {modelName}
                        </SelectItem>
                      ))
                    : OPENROUTER_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className='flex-grow overflow-y-auto'>
            <div className='space-y-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <ChatMarkdownRenderer
                    content={message.content}
                    isUser={message.role === 'user'}
                  />
                </div>
              ))}
              {isLoading && (
                <div className='flex justify-start'>
                  <div className='bg-gray-200 rounded-lg p-4 flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span className='text-sm text-gray-600'>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleFormSubmit} className='flex w-full space-x-2'>
              <TextArea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder='Type your message...'
                className='flex-grow'
              />
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
