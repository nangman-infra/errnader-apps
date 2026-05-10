export type WhenOption = 'now' | 'today' | 'tomorrow' | 'custom';

export interface PhotoItem {
  id: string;
  localUri: string;
  publicUrl: string | null;
  isUploading: boolean;
}

export interface ErrandFormData {
  what: string;
  when: WhenOption;
  customDate?: Date;
  areaId: string | undefined;
  where: string;
  photos: PhotoItem[];
}

export type ErrandStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface Errand {
  errandId: string;
  userId: string;
  status: ErrandStatus;
  title: string;
  category: string;
  when: string;
  areaId: string | null;
  where: string;
  photoUrls: string[];
  detail: string | null;
  erranderId: string | null;
  createdAt: string;
  updatedAt: string;
}
