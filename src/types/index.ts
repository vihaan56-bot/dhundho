export type LocationNodeType = 'room' | 'furniture' | 'cabinet' | 'shelf' | 'drawer' | 'box' | 'other';

export interface LocationNode {
  id: string;
  name: string;
  type: LocationNodeType;
  parentId: string | null; // null for top-level rooms
  icon: string; // Emoji character or Lucide icon key
  photo?: string; // Optional base64 data URI of the physical space/cabinet
}

export interface Thing {
  id: string;
  name: string;
  category: 'Electronics' | 'Documents' | 'Tools' | 'Kitchen' | 'Clothing' | 'Other';
  locationPath: string[]; // Ordered list of LocationNode IDs starting from a Room down to the leaf node
  quantity: number;
  notes: string;
  tags: string[];
  expiryDate?: string; // YYYY-MM-DD
  photo?: string; // Base64 data URI
  lastUpdated: string; // ISO timestamp
  frequencySearched: number;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: string; // ISO timestamp
}
