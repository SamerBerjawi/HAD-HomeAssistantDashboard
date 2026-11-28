// Keep the headline and primary action visible. Secondary items stay accessible in the sheet.
export class TileFit {
  private observer = new ResizeObserver(() => this.update());
  constructor(private card: HTMLElement, private content: HTMLElement) {}
  connect() { this.observer.observe(this.card); this.update(); }
  disconnect() { this.observer.disconnect(); }
  update() {
    const height = this.card.clientHeight;
    if (!height) return;
    const extras = this.content.querySelectorAll<HTMLElement>('.light-controls button:not(:first-child), .portrait');
    for (const item of extras) item.hidden = false;
    const limit = this.card.getBoundingClientRect().top + height - 6;
    for (const item of extras) {
      if (item.getBoundingClientRect().bottom > limit) item.hidden = true;
    }
  }
}
