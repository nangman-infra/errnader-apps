import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

interface CreateChatRoomPayload {
  errandId: string;
  participantId: string;
}

interface CreateChatRoomResponse {
  roomId: string;
}

interface CreateConfirmationCardPayload {
  receiverId: string;
  priceAmount: number;
  currency: 'KRW';
  scheduledAt: string;
  place: string;
  note?: string;
  errandTitle?: string;
}

interface RespondPayload {
  action: 'ACCEPT' | 'REJECT';
}

interface CreateReviewPayload {
  revieweeId: string;
  rating: number;
  content?: string;
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateChatRoomPayload) => {
      const { data } = await apiClient.post<CreateChatRoomResponse>('/chat/rooms', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

export function useCreateConfirmationCard(errandId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConfirmationCardPayload) => apiClient.post(`/errands/${errandId}/confirmation-cards`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

export function useRespondConfirmationCard(errandId: string | undefined, cardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RespondPayload) => apiClient.patch(`/errands/${errandId}/confirmation-cards/${cardId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
}

export function useCreateCompletionRequest(errandId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/errands/${errandId}/completion-requests`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
    },
  });
}

export function useRespondCompletionRequest(errandId: string | undefined, requestId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RespondPayload) => apiClient.patch(`/errands/${errandId}/completion-requests/${requestId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}

export function useCreateReview(errandId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => apiClient.post(`/errands/${errandId}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errand', errandId] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
}
