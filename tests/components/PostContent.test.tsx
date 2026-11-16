import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PostContent } from '@/components/reader/PostContent';
import * as storageService from '@/services/storage.service';

describe('PostContent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard markdown headings, paragraphs, blockquotes, and lists', () => {
    const md = `## Subtítulo Editorial\n\nUm parágrafo com **negrito** e *itálico*.\n\n> Citação clássica\n\n- Item 1\n- Item 2`;
    render(<PostContent markdown={md} />);

    expect(screen.getByRole('heading', { name: 'Subtítulo Editorial' })).toBeInTheDocument();
    expect(screen.getByText(/Um parágrafo com/)).toBeInTheDocument();
    expect(screen.getByText('Citação clássica')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('strips malicious script tags and XSS event handlers', () => {
    const maliciousMd = `Texto seguro.\n\n<script>window.xssExecuted = true;</script>\n\n<img src="x" onerror="alert(1)" />\n\n[Clique aqui](javascript:alert(1))`;
    const { container } = render(<PostContent markdown={maliciousMd} />);

    expect(container.querySelector('script')).toBeNull();
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
    }
    const link = container.querySelector('a');
    if (link) {
      expect(link.getAttribute('href') ?? '').not.toContain('javascript:');
    }
    expect(screen.getByText(/Texto seguro/)).toBeInTheDocument();
  });

  it('resolves castalia-media:// images safely inside Markdown content', async () => {
    vi.spyOn(storageService, 'resolveMediaUrl').mockResolvedValueOnce(
      'data:image/webp;base64,QUJDREVGRw=='
    );

    render(<PostContent markdown={'![Minha Foto](castalia-media://123-minha-foto)'} />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Minha Foto' });
      expect(img).toHaveAttribute('src', 'data:image/webp;base64,QUJDREVGRw==');
    });
  });
});
