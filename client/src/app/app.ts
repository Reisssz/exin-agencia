import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { PortfolioApiService } from './portfolio-api.service';
import { RevealDirective } from './reveal.directive';
import { PORTFOLIO_FALLBACK, PortfolioItem } from './portfolio.types';

@Component({
  imports: [RevealDirective],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.template.html',
})
export class App implements OnInit {
  protected readonly portfolio = signal(PORTFOLIO_FALLBACK);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly menuOpen = signal(false);
  protected readonly selectedVideo = signal<PortfolioItem | null>(null);
  protected readonly legalDocument = signal<'privacy' | 'terms' | null>(null);
  protected readonly services = [
    {
      number: '01',
      name: 'Branding',
      summary:
        'Identidades visuais que existem como sistemas vivos, linguagens completas de marca que constroem posicionamentos consistentes e duradouros.',
      audience: 'Negócios que precisam ocupar um lugar próprio no mercado.',
      tags: ['Identidade visual', 'Posicionamento', 'Naming', 'Brand voice'],
    },
    {
      number: '02',
      name: 'Conteúdo',
      summary:
        'Cada imagem e vídeo produzido com intenção, estética refinada e propósito claro. Conteúdo que carrega estratégia em cada frame e constrói autoridade real.',
      audience: 'Marcas que querem comunicar com constância e personalidade.',
      tags: ['Social media', 'Vídeo', 'Fotografia', 'Motion'],
    },
    {
      number: '03',
      name: 'Tráfego',
      summary:
        'Estratégias que transformam plataformas em motores de resultado. O algoritmo trabalha para quem tem estratégia e garantimos que ele trabalhe para você.',
      audience: 'Empresas prontas para transformar atenção em novas vendas.',
      tags: ['Meta Ads', 'Google Ads', 'Analytics', 'Performance'],
    },
  ];

  @ViewChild('videoDialog') private videoDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('legalDialog') private legalDialog?: ElementRef<HTMLDialogElement>;

  private readonly portfolioApi = inject(PortfolioApiService);

  ngOnInit(): void {
    const localPosters = new Map(PORTFOLIO_FALLBACK.map((item) => [item.id, item.poster]));
    this.portfolioApi.getPortfolio().subscribe({
      next: (items) => {
        if (items.length) {
          this.portfolio.set(
            items.map((item) => ({
              ...item,
              poster: item.poster || localPosters.get(item.id) || '/logo-exin.png',
            })),
          );
        }
      },
      error: () => undefined,
    });
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected openVideo(item: PortfolioItem): void {
    if (item.source.type === 'instagram') {
      window.open(item.source.url, '_blank', 'noopener,noreferrer');
      return;
    }

    this.selectedVideo.set(item);
    requestAnimationFrame(() => {
      const dialog = this.videoDialog?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
  }

  protected openLegal(document: 'privacy' | 'terms'): void {
    this.legalDocument.set(document);
    requestAnimationFrame(() => {
      const dialog = this.legalDialog?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
  }

  protected startWhatsApp(event: SubmitEvent, name: string, project: string): void {
    event.preventDefault();
    const message = `Olá! Meu nome é ${name.trim()} e quero conversar sobre meu projeto.${project.trim() ? `\n\n${project.trim()}` : ''}`;
    window.open(
      `https://wa.me/5591980785068?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }
}
