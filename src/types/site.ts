export interface NavItem {
  label: string;
  path: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  avatar: string;
  location?: string;
  social: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  editionLabel: string;
  author: AuthorProfile;
  navigation: NavItem[];
  quickArchive: NavItem[];
}
