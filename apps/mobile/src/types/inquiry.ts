export interface Inquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}
