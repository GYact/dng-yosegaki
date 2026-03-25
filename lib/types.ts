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
  to_slug: string;
  from_name: string;
  body: string;
  created_at: string;
}

export interface Photo {
  id: string;
  graduate_slug: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}
