export interface UIComponent {
  id: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
  tags: string;
  files: string;
  dependencies: string;
  registry_deps: string;
  preview_code: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
