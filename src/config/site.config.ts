import type { SiteConfig } from '@/types/site';

export const siteConfig: SiteConfig = {
  title: 'Diário de Castália',
  subtitle: 'Notícias da capital do imaginário',
  description: 'Publicação independente sobre tecnologia, design de sistemas e crônicas cotidianas.',
  editionLabel: 'Edição Digital • Acesso Público',
  author: {
    name: 'Willy Garabini Cornelissen',
    bio: 'Arquiteto de software, escritor e entusiasta de sistemas distribuídos e jornalismo digital.',
    avatar: '',
    location: 'Brasil',
    social: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
    },
  },
  navigation: [
    { label: 'Capa', path: '/' },
    { label: 'Editorial', path: '/tag/editorial' },
    { label: 'Tecnologia', path: '/tag/tecnologia' },
    { label: 'Ensaios', path: '/tag/ensaios' },
  ],
  quickArchive: [
    { label: 'Nova Acrópole', path: '/tag/nova-acropole' },
    { label: 'Grupo Fermata', path: '/tag/grupo-fermata' },
    { label: 'Clube Dom Quixote', path: '/tag/clube-dom-quixote' },
    { label: 'Clube Athena', path: '/tag/clube-athena' },
    { label: 'Dáblio Labs', path: '/tag/dablio-labs' },
  ],
};
