import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, afterNextRender, inject, signal } from '@angular/core';
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
  private readonly document = inject(DOCUMENT);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private resolvePortfolioReady!: () => void;
  private readonly portfolioReady = new Promise<void>((resolve) => {
    this.resolvePortfolioReady = resolve;
  });

  constructor() {
    afterNextRender(() => void this.finishLoading());
  }

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
        this.resolvePortfolioReady();
      },
      error: () => this.resolvePortfolioReady(),
    });
  }

  private async finishLoading(): Promise<void> {
    const view = this.document.defaultView;
    if (!view) return;

    const retryButton = this.document.getElementById('loader-retry');
    const retry = () => view.location.reload();
    retryButton?.addEventListener('click', retry);
    const timeoutId = view.setTimeout(() => {
      const label = this.document.querySelector('.site-loader-label');
      if (label) label.textContent = 'Preparando os vídeos';
      retryButton?.removeAttribute('hidden');
    }, 15000);
    this.destroyRef.onDestroy(() => view.clearTimeout(timeoutId));
    this.destroyRef.onDestroy(() => retryButton?.removeEventListener('click', retry));

    await this.portfolioReady;
    await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
    if (this.destroyRef.destroyed) return;

    const images = Array.from(this.document.images);
    const videos = Array.from(this.host.nativeElement.querySelectorAll<HTMLVideoElement>('.portfolio-video'));
    await Promise.all([
      this.document.fonts?.ready.catch(() => undefined),
      ...images.map((image) => this.waitForImage(image)),
      ...videos.map((video) => this.waitForVideo(video)),
    ]);
    await new Promise<void>((resolve) => view.requestAnimationFrame(() => resolve()));
    view.clearTimeout(timeoutId);
    retryButton?.removeEventListener('click', retry);
    if (this.destroyRef.destroyed) return;

    this.host.nativeElement.removeAttribute('inert');
    this.host.nativeElement.setAttribute('aria-busy', 'false');
    this.document.body.classList.remove('is-loading');
    this.document.getElementById('site-loader')?.classList.add('is-complete');
  }

  private async waitForVideo(video: HTMLVideoElement): Promise<void> {
    await new Promise<void>((resolve) => {
      const settled = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          video.classList.add('frame-ready');
        }
        video.removeEventListener('loadeddata', settled);
        video.removeEventListener('error', settled);
        resolve();
      };
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || video.error) {
        settled();
        return;
      }
      video.addEventListener('loadeddata', settled, { once: true });
      video.addEventListener('error', settled, { once: true });
      this.destroyRef.onDestroy(settled);
      video.load();
    });
  }

  private async waitForImage(image: HTMLImageElement): Promise<void> {
    image.loading = 'eager';
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        const settled = () => {
          image.removeEventListener('load', settled);
          image.removeEventListener('error', settled);
          resolve();
        };
        image.addEventListener('load', settled, { once: true });
        image.addEventListener('error', settled, { once: true });
      });
    }
    if (image.naturalWidth && typeof image.decode === 'function') {
      await image.decode().catch(() => undefined);
    }
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
