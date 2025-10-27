"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { apiClient } from '@/lib/api-client';
import { WorkspaceTodo } from '@/types/backend';

interface TodoListProps {
  caseId?: string | null;
  onProgressUpdate?: (completed: number, total: number) => void;
}

export default function TodoList({ caseId, onProgressUpdate }: TodoListProps) {
  const [todos, setTodos] = useState<WorkspaceTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load todos
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/workspace/todos?caseId=${caseId || ''}`);
        setTodos(response.todos || []);
      } catch (error) {
        console.error('Failed to fetch todos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [caseId]);

  // Update progress when todos change
  useEffect(() => {
    if (onProgressUpdate) {
      const completed = todos.filter(todo => todo.completed).length;
      onProgressUpdate(completed, todos.length);
    }
  }, [todos, onProgressUpdate]);

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      const newTodo = await apiClient.post('/api/workspace/todos', {
        text: newTodoText.trim(),
        caseId,
        order: todos.length,
      });

      setTodos(prev => [...prev, newTodo]);
      setNewTodoText('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    try {
      await apiClient.put(`/api/workspace/todos/${todoId}`, { completed });
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, completed } : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await apiClient.delete(`/api/workspace/todos/${todoId}`);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add new todo */}
      {isAdding ? (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleAddTodo}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
          >
            <Icon name="check" className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTodoText('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-md transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Add a task</span>
        </button>
      )}

      {/* Todo list */}
      {todos.length === 0 ? (
        <div className="text-center py-4">
          <Icon name="checkCircle" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center space-x-3 group hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <button
                onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {todo.completed && <Icon name="check" className="w-3 h-3" />}
              </button>
              <span
                className={`flex-1 text-sm ${
                  todo.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-800'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              >
                <Icon name="trash" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
