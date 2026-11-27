export function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}


export function expandButton(label: string, open: () => void) {
  const button = node('button', '↗');
  button.className = 'expand';
  button.type = 'button';
  button.title = 'Expand ' + label;
  button.setAttribute('aria-label', button.title);
  button.setAttribute('aria-haspopup', 'dialog');
  button.onclick = open;
  return button;
}

export abstract class Sheet {
  readonly dialog = node('dialog');
  protected readonly body = node('div');
  private readonly close = node('button', '×');

  constructor(label: string) {
    this.dialog.setAttribute('aria-label', label + " details");
    this.close.className = 'sheet-close';
    this.close.setAttribute('aria-label', 'Close ' + label + ' details');
    this.close.onclick = () => this.dialog.close();
    this.dialog.append(this.close, this.body);
    this.dialog.onclick = event => {
      if (event.target === this.dialog) {
        const rect = this.dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.dialog.close();
      }
    };
  }

  open() {
    this.dialog.showModal();
    this.draw();
    this.close.focus();
  }

  protected abstract draw(): void;
}
