import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostContent } from '@/components/reader/PostContent';

describe('PostContent', () => {
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
});
