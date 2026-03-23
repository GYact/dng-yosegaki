export interface Graduate {
  slug: string;
  name: string;
  role: string;
}

export interface GraduateData {
  year: number;
  labName: string;
  graduates: Graduate[];
}

export interface Message {
  id: string;
  to: string;
  from: string;
  body: string;
  createdAt: string;
}

export interface MessageData {
  messages: Message[];
}
