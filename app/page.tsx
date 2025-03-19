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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = async (message: string) => {
    try {
      setIsLoading(true);

      // Add user message to the UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
      };
      setMessages((prev) => [...prev, userMessage]);

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
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: model,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant's response to the messages
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally handle error in UI
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
                  {modelType === 'ollama' ? (
                    ollamaModels.map((modelName) => (
                      <SelectItem key={modelName} value={modelName}>
                        {modelName}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value='gpt-3.5-turbo'>
                        GPT-3.5 Turbo
                      </SelectItem>
                      <SelectItem value='gpt-4'>GPT-4</SelectItem>
                      <SelectItem value='claude-2'>Claude 2</SelectItem>
                    </>
                  )}
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
