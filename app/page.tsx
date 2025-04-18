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
    const messageContent = input.trim(); // Store trimmed input
    if (!messageContent) return;

    // Clear input immediately
    setInput('');

    let conversationId = currentConversationId;
    let isNewConversation = false; // Flag to track if we just created a conversation
    let newConversationData: Conversation | null = null; // To hold newly created conversation data

    // Create new conversation if none exists
    if (!conversationId) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Chat', // Use temporary title
            model: model,
            llm: modelType,
          }),
        });

        if (!response.ok) throw new Error('Failed to create conversation');
        const data = await response.json();
        newConversationData = data.conversation; // Store conversation data
        conversationId = newConversationData!.id; // Use exclamation mark since we check below
        setCurrentConversationId(conversationId);
        // Add the new conversation with the temporary title and empty messages array
        setConversations((prev) => [
          ...prev,
          { ...newConversationData!, messages: [] },
        ]);
        setMessages([]); // Clear messages for the new chat
        isNewConversation = true; // Mark as new conversation
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

    // Create the user message object
    const userMessage: Message = {
      role: 'user',
      content: messageContent, // Use stored trimmed content
      model: model,
      llm: modelType,
      conversation_id: conversationId,
    };

    // Immediately add user message to the UI for responsiveness
    // Use a functional update to ensure we have the latest messages state
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Check if it's the first message being sent *for this specific conversation*
    const isFirstMessageForTitle = isNewConversation; // Trigger only for the first message submit of a new conversation

    try {
      setIsLoading(true);

      // --- Save user message ---
      const saveUserMessageResponse = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMessage),
        },
      );

      if (!saveUserMessageResponse.ok) {
        // If saving fails, remove the optimistically added message
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg !== userMessage),
        );
        throw new Error('Failed to save user message');
      }
      const savedConversationData = await saveUserMessageResponse.json();
      // Update messages state with the actual data from the DB
      setMessages(savedConversationData.messages);

      // --- Generate Title in background if it's the first message ---
      if (isFirstMessageForTitle) {
        // No need to await this, let it run in the background
        fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversationId,
            messageContent: messageContent,
          }),
        })
          .then((titleResponse) => {
            if (titleResponse.ok) {
              return titleResponse.json();
            }
            console.warn('Failed to generate title automatically.');
            return null; // Return null if title generation failed
          })
          .then((data) => {
            if (data && data.title) {
              // Update the title in the sidebar using the existing handler
              handleTitleChange(conversationId!, data.title);
            }
          })
          .catch((titleError) => {
            console.error('Error generating title:', titleError);
          });
      }

      // --- Get AI response ---
      if (!model) {
        // Revert optimistic update if model selection is missing
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg !== userMessage),
        );
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
            messages: savedConversationData.messages, // Use messages returned after saving user message
            model: model,
          }),
        },
      );

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        // Revert optimistic update
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg !== userMessage),
        );
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiData = await aiResponse.json();

      // Create the AI message object
      const assistantMessage: Message = {
        role: 'assistant',
        // Handle potential differences in response structure (e.g., Ollama vs OpenRouter)
        content:
          typeof aiData.message === 'object'
            ? aiData.message.content
            : aiData.content || aiData.message,
        model: model,
        llm: modelType,
        conversation_id: conversationId,
      };

      // Add AI message to UI immediately
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // --- Save AI response ---
      const saveAiResponse = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assistantMessage),
        },
      );

      if (!saveAiResponse.ok) {
        // If saving AI response fails, remove the optimistically added AI message
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg !== assistantMessage),
        );
        throw new Error('Failed to save AI response');
      }
      const finalData = await saveAiResponse.json();
      // Update with final state from DB after saving AI message
      setMessages(finalData.messages);
    } catch (error) {
      console.error('Error during message processing:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to process message',
      );
      // Note: More sophisticated error handling might be needed to fully revert UI state
      // depending on where the error occurred. For now, we revert optimistic updates on known failures.
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

  const handleDelete = (conversationId: number) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversationId),
    );
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
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
                onDelete={handleDelete}
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
