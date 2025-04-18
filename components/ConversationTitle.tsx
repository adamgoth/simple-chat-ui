import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Pencil,
  Check,
  X,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Message } from '@/types/chat';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface ConversationTitleProps {
  id: number;
  title: string;
  onTitleChange: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationTitle({
  id,
  title,
  onTitleChange,
  onDelete,
  isSelected,
  onClick,
}: ConversationTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editTitle.trim() === title) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update title');
      onTitleChange(id, editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating title:', error);
      setEditTitle(title);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');
      onDelete(id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleGenerateTitleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGeneratingTitle(true);
    try {
      const convResponse = await fetch(`/api/conversations/${id}`);
      if (!convResponse.ok)
        throw new Error('Failed to fetch conversation data');
      const convData = await convResponse.json();
      const messages: Message[] = convData.messages;

      if (!messages || messages.length === 0) {
        throw new Error('No messages found to generate title from.');
      }

      const titleResponse = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, messages: messages }),
      });

      if (!titleResponse.ok) {
        const errorData = await titleResponse.json();
        throw new Error(errorData.error || 'Failed to generate title');
      }

      const data = await titleResponse.json();

      if (data && data.title) {
        onTitleChange(id, data.title);
        setIsMenuOpen(false);
      } else {
        throw new Error('API did not return a valid title.');
      }
    } catch (error) {
      console.error('Error generating title:', error);
      alert(
        `Failed to generate title: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className='flex items-center gap-2 w-full mb-2'
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className='flex-1'
        />
        <button
          onClick={handleSave}
          className='p-1 rounded-full hover:bg-gray-200 text-green-600'
          title='Save'
        >
          <Check className='h-4 w-4' />
        </button>
        <button
          onClick={handleCancel}
          className='p-1 rounded-full hover:bg-gray-200 text-red-600'
          title='Cancel'
        >
          <X className='h-4 w-4' />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className='relative mb-2 group'>
        <Button
          onClick={onClick}
          variant={isSelected ? 'default' : 'ghost'}
          className='w-full justify-start'
        >
          <span className='flex-1 truncate text-left'>{title}</span>
        </Button>
        <div className='absolute right-2 top-1/2 -translate-y-1/2'>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className='p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <MoreHorizontal className='h-4 w-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleEditClick(e as any);
                }}
              >
                <Pencil className='mr-2 h-4 w-4' />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isGeneratingTitle) {
                    handleGenerateTitleClick(e as any);
                  }
                }}
                disabled={isGeneratingTitle}
              >
                {isGeneratingTitle ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Sparkles className='mr-2 h-4 w-4' />
                )}
                <span>
                  {isGeneratingTitle ? 'Generating...' : 'Generate Title'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleDeleteClick(e as any);
                }}
                className='text-red-600'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
