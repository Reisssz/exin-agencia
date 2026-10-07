import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(2);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.classList.remove('is-loading');
    document.getElementById('site-loader')?.remove();
    document.getElementById('loading-test-asset')?.remove();
  });

  it('renders the EXIN sections and loads portfolio data', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const request = httpTesting.expectOne('/api/portfolio');
    expect(request.request.method).toBe('GET');
    request.flush([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Estratégia de');
    expect(compiled.querySelector('.ticker-track')?.textContent).toContain('Agrocangaia');
    expect(compiled.querySelector('.ticker-track')?.textContent).not.toContain('Escuta');
    expect(compiled.querySelector('.client-strip')).toBeNull();
    expect(compiled.querySelectorAll('.service-item').length).toBe(3);
    expect(compiled.querySelectorAll('.portfolio-item img').length).toBe(6);
    expect(
      (compiled.querySelector('.portfolio-item img') as HTMLImageElement).getAttribute('src'),
    ).toContain('agrocangaia-thumb.webp');
    expect(compiled.querySelectorAll('.portfolio-video').length).toBe(6);
    expect(compiled.querySelector('.dialog-video')).toBeNull();
    expect(compiled.querySelector('#dark-matter')).toBeNull();
    const developerLink = compiled.querySelector('footer a[href="https://weblytics.com.br"]');
    expect(developerLink?.textContent).toContain('Desenvolvido por');
    expect(developerLink?.getAttribute('target')).toBe('_blank');
    expect(developerLink?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the fallback portfolio when the API is unavailable', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting
      .expectOne('/api/portfolio')
      .flush('offline', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.portfolio-item').length).toBe(
      6,
    );
  });

  it('holds the loader until the portfolio response and rendered frames are ready', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    });
    const loader = document.createElement('div');
    loader.id = 'site-loader';
    document.body.append(loader);
    document.body.classList.add('is-loading');
    const fixture = TestBed.createComponent(App);
    fixture.nativeElement.setAttribute('inert', '');
    fixture.detectChanges();

    expect(document.body.classList.contains('is-loading')).toBe(true);
    expect(fixture.nativeElement.hasAttribute('inert')).toBe(true);
    httpTesting.expectOne('/api/portfolio').flush([]);
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(document.body.classList.contains('is-loading')).toBe(false);
      expect(loader.classList.contains('is-complete')).toBe(true);
      expect(fixture.nativeElement.hasAttribute('inert')).toBe(false);
      expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('false');
    });
  });

  it('releases the loader with the local portfolio when the API fails', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    });
    document.body.classList.add('is-loading');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/portfolio').flush('offline', {
      status: 503,
      statusText: 'Unavailable',
    });
    fixture.detectChanges();

    await vi.waitFor(() => {
      expect(document.body.classList.contains('is-loading')).toBe(false);
      expect(fixture.nativeElement.querySelectorAll('.portfolio-item').length).toBe(6);
    });
  });

  it('waits for an image and also releases the loader if that image fails', async () => {
    const image = document.createElement('img');
    image.id = 'loading-test-asset';
    document.body.append(image);
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(function (this: HTMLImageElement) {
      return this !== image;
    });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    });
    document.body.classList.add('is-loading');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/portfolio').flush([]);
    fixture.detectChanges();

    await vi.waitFor(() => expect(image.loading).toBe('eager'));
    expect(document.body.classList.contains('is-loading')).toBe(true);
    image.dispatchEvent(new Event('error'));

    await vi.waitFor(() => expect(document.body.classList.contains('is-loading')).toBe(false));
  });

  it('reveals sections on intersection without navigation or manual change detection', async () => {
    const callbacks: IntersectionObserverCallback[] = [];
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }
      observe(): void {}
      disconnect(): void {}
    });
    const initialHash = window.location.hash;
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/portfolio').flush([]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.manifesto-content')?.classList.contains('is-visible')).toBe(false);

    callbacks.forEach((callback) => callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ));

    await vi.waitFor(() => {
      expect(compiled.querySelector('.manifesto-content')?.classList.contains('is-visible')).toBe(true);
      expect(compiled.querySelectorAll('.portfolio-item.is-visible').length).toBe(6);
    });
    expect(window.location.hash).toBe(initialHash);
  });

  it('keeps loading until every portfolio video has a rendered first frame', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    });
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockImplementation(function (this: HTMLMediaElement) {
      return this.getAttribute('src')?.includes('AGROCANGAIA') ? 0 : 2;
    });
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    document.body.classList.add('is-loading');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTesting.expectOne('/api/portfolio').flush([]);
    fixture.detectChanges();

    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    expect(document.body.classList.contains('is-loading')).toBe(true);
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(2);
    fixture.nativeElement.querySelector('.portfolio-video').dispatchEvent(new Event('loadeddata'));

    await vi.waitFor(() => {
      expect(document.body.classList.contains('is-loading')).toBe(false);
      expect(fixture.nativeElement.querySelectorAll('.portfolio-video.frame-ready').length).toBe(6);
    });
  });
});
