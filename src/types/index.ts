export type AvailabilityStatus = 'Available' | 'Out of Stock' | 'Discontinued';
export type EnquiryStatus = 'Pending' | 'In Progress' | 'Responded' | 'Closed';
export type EnquirySource = 'Manual' | 'Gmail';
export type CommunicationChannel = 'Gmail' | 'Manual' | 'Phone' | 'In-Store';
export type CommunicationDirection = 'Incoming' | 'Outgoing';
export type CommunicationStatus = 'Draft' | 'Sent' | 'Delivered' | 'Failed' | 'Received';
export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // in INR
  availability: AvailabilityStatus;
  brand?: string;
  sku?: string;
  stockCount?: number;
  imageUrl?: string;
  specs?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export interface Enquiry {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  enquiryText: string;
  productId?: string;
  productName?: string;
  source: EnquirySource;
  status: EnquiryStatus;
  urgency?: UrgencyLevel;
  urgencyScore?: number;
  urgencyReason?: string;
  assignedStaff?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  draftResponse?: string;
  receivedAt: string;
  updatedAt?: string;
}

export interface Communication {
  id: string;
  customerId: string;
  enquiryId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject?: string;
  messageBody: string;
  status: CommunicationStatus;
  urgency?: UrgencyLevel;
  gmailMessageId?: string;
  sentOrReceivedAt: string;
  createdAt: string;
  authorName?: string;
}

export interface SyncedEmail {
  id: string;
  gmailMessageId: string;
  threadId?: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  bodyText: string;
  snippet?: string;
  urgency: UrgencyLevel;
  urgencyScore: number; // 1-100
  urgencyReason: string;
  recommendedAction?: string;
  aiCategory?: string;
  isSalesEnquiry: boolean;
  matchedProductId?: string;
  matchedProductName?: string;
  customerId?: string;
  enquiryId?: string;
  receivedAt: string;
  syncedAt: string;
  status: 'New' | 'In Review' | 'Replied' | 'Archived';
}

export interface StaffUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Representative';
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  availableProducts: number;
  totalEnquiries: number;
  pendingEnquiries: number;
  inProgressEnquiries: number;
  respondedEnquiries: number;
  closedEnquiries: number;
  awaitingResponseCount: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: {
    type: 'view_enquiry' | 'view_customer' | 'view_product' | 'draft_reply';
    label: string;
    targetId: string;
    extra?: any;
  }[];
  matchedData?: {
    customers?: Customer[];
    products?: Product[];
    enquiries?: Enquiry[];
  };
}
