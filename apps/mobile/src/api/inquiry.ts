import { apiClient } from './client';
import { Inquiry } from '../types/inquiry';

interface CreateInquiryPayload {
  title: string;
  content: string;
  photoUrls?: string[];
}

interface CreateInquiryResponse {
  inquiryId: string;
  status: string;
  createdAt: string;
}

export const createInquiry = (payload: CreateInquiryPayload) =>
  apiClient.post<CreateInquiryResponse>('/inquiries', payload);

export const fetchInquiries = () =>
  apiClient.get<{ items: Inquiry[] }>('/inquiries');
