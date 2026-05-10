export interface Inquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  createdAt: string;
  updatedAt: string;
}
