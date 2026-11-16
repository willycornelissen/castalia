import type { SiteConfig } from '@/types/site';

export const siteConfig: SiteConfig = {
  title: 'Diário de Castália',
  subtitle: 'Notícias da capital do imaginário',
  description:
    'Castália é uma província pedagógica e utópica imaginada por Hermann Hesse em O Jogo das Contas de Vidro, concebida no futuro do século XXIII como um refúgio austero para a elite intelectual.',
  editionLabel: 'Edição Digital • Acesso Público',
  author: {
    name: 'Magister Ludi',
    bio: 'A verdadeira mestria não é o domínio tirânico sobre o saber, mas a submissão impessoal à verdade e à ordem espiritual',
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
