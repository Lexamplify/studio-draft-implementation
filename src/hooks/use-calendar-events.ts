import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CalendarEvent } from '@/types/backend';

interface FetchEventsParams {
  timeMin?: string;
  timeMax?: string;
  includeGoogle?: boolean;
  tokens?: string;
}

export function useCalendarEvents(params: FetchEventsParams = {}) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['calendar-events', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.timeMin) searchParams.append('timeMin', params.timeMin);
      if (params.timeMax) searchParams.append('timeMax', params.timeMax);
      if (params.includeGoogle) searchParams.append('includeGoogle', 'true');
      if (params.tokens) searchParams.append('tokens', params.tokens);
      
      const url = `/api/calendar/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      return apiClient.get(url);
    },
  });
  
  const createEventMutation = useMutation({
    mutationFn: async (data: Partial<CalendarEvent> & { tokens?: string }) => {
      return apiClient.post('/api/calendar/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
  
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CalendarEvent> & { tokens?: string } }) => {
      return apiClient.put(`/api/calendar/events?id=${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: async ({ id, tokens }: { id: string; tokens?: string }) => {
      const url = `/api/calendar/events?id=${id}${tokens ? `&tokens=${encodeURIComponent(tokens)}` : ''}`;
      return apiClient.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
  
  return {
    events: query.data?.events || [],
    count: query.data?.count || 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    
    creating: createEventMutation.isPending,
    updating: updateEventMutation.isPending,
    deleting: deleteEventMutation.isPending,
  };
}


