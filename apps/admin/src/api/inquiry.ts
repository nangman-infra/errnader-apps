import { apiClient } from './client';

export interface Inquiry {
  inquiryId: string;
  userId: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export const getInquiries = (status?: string) =>
  apiClient.get<{ items: Inquiry[]; total: number }>('/admin/inquiries', {
    params: status ? { status } : undefined,
  });

export const answerInquiry = (inquiryId: string, answer: string) =>
  apiClient.patch(`/admin/inquiries/${inquiryId}`, { answer });
