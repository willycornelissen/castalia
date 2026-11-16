import type { PostTemplate } from '@/types/post';

export const RESENHA_DEFAULT_TAGS = ['resenha'] as const;

export const RESENHA_MARKDOWN_TEMPLATE = `## Informações Bibliográficas

- **Obra:** 
- **Autor(a):** 
- **Editora / Ano:** 
- **Edição / Páginas:** 

## Leitura Analítica



## Excertos

> `;

/**
 * Normalizes a template query parameter or stored value into a supported PostTemplate.
 */
export function parsePostTemplate(value: string | null | undefined): PostTemplate {
  return value === 'resenha' ? 'resenha' : 'article';
}
