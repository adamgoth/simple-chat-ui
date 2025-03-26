import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('isEditing changed:', isEditing);
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    console.log('Edit icon clicked');
    e.preventDefault();
    e.stopPropagation();
    console.log('Setting isEditing to true');
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
      // Revert to original title on error
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
          <span className='flex-1 truncate'>{title}</span>
        </Button>
        <div className='absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
          <button
            onClick={handleEditClick}
            className='p-1 rounded-full hover:bg-gray-200'
            title='Edit'
          >
            <Pencil className='h-4 w-4' />
          </button>
          <button
            onClick={handleDeleteClick}
            className='p-1 rounded-full hover:bg-gray-200 text-red-600'
            title='Delete'
          >
            <Trash2 className='h-4 w-4' />
          </button>
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
