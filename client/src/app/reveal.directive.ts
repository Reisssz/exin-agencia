import { AfterViewInit, Directive, ElementRef, HostBinding, OnDestroy } from '@angular/core';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  @HostBinding('class.is-visible') private visible = false;

  private observer?: IntersectionObserver;

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const reducedMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.visible = true;
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible = true;
          this.observer?.disconnect();
        }
      },
      { rootMargin: '0px 0px -36px 0px' },
    );

    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
