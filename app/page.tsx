'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Message } from '@/types/message';
import type { Conversation } from '@/types/conversation';

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
    string | null
  >(null);

  // New states to replace useChat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Ollama models on component mount
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
        // Set default model if available
        if (modelNames.length > 0 && modelType === 'ollama') {
          setModel(modelNames[0]);
        }
      } catch (error) {
        console.error('Error fetching Ollama models:', error);
      }
    };

    if (modelType === 'ollama') {
      fetchOllamaModels();
    }
  }, [modelType]);

  // Sync messages with current conversation
  useEffect(() => {
    if (currentConversationId) {
      const currentConversation = conversations.find(
        (conv) => conv.id === currentConversationId,
      );
      if (currentConversation) {
        setMessages(currentConversation.messages);
      }
    }
  }, [currentConversationId, conversations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const sendMessage = async (message: string) => {
    try {
      setIsLoading(true);

      if (!model) {
        throw new Error('Please select a model first');
      }

      // Add user message to the UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
      };
      const updatedMessages = [...messages, userMessage];
      updateConversationMessages(updatedMessages);

      // Prepare the request body based on model type
      const requestBody = {
        messages: updatedMessages,
        model: model,
      };

      // Send the message to the appropriate API endpoint
      const response = await fetch(
        modelType === 'openrouter'
          ? '/api/chat-openrouter'
          : '/api/chat-ollama',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      // Add assistant's response to the messages
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || data.message,
      };
      updateConversationMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Add error handling in UI
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentConversationId) {
      createNewConversation();
    }
    if (input.trim()) {
      await sendMessage(input);
    }
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
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
              <Button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                variant={
                  currentConversationId === conversation.id
                    ? 'default'
                    : 'ghost'
                }
                className='w-full justify-start mb-2'
              >
                {conversation.title}
              </Button>
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
                  <SelectItem value='openrouter'>OpenRouter</SelectItem>
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
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-black'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleFormSubmit} className='flex w-full space-x-2'>
              <Input
                value={input}
                onChange={handleInputChange}
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
