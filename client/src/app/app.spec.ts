import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
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
    expect(compiled.querySelectorAll('.service-item').length).toBe(3);
    expect(compiled.querySelectorAll('.portfolio-item img').length).toBe(6);
    expect(
      (compiled.querySelector('.portfolio-item img') as HTMLImageElement).getAttribute('src'),
    ).toContain('agrocangaia-thumb.webp');
    expect(compiled.querySelectorAll('video').length).toBe(0);
    expect(compiled.querySelector('#dark-matter')).toBeNull();
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
});
