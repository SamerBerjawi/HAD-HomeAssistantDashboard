import * as L from 'leaflet';
import leafletCss from 'leaflet/dist/leaflet.css';
import type { Member } from './people-card';
import { personInitials } from '../../src/pro/lib/overviewPills';

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

function location(person: Member) {
  if (person.tone === 'home') return 'At home';
  if (person.tone === 'away') return 'Away from home';
  return person.status;
}

function point(p: Member): L.LatLngTuple | undefined {
  const { latitude, longitude } = p.attributes ?? {};
  if (typeof latitude === 'number' && typeof longitude === 'number' &&
      Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return [latitude, longitude];
}

function age(p: Member) {
  const minutes = Math.floor((Date.now() - Date.parse(p.updated ?? '')) / 60000);
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return 'Just now';
  return minutes < 60 ? minutes + 'm ago' : Math.floor(minutes / 60) + 'h ago';
}

export class PeopleSheet {
  readonly dialog = node('dialog');
  private readonly body = node('div');
  private readonly close = node('button', '×');
  private map?: L.Map;
  private members: Member[] = [];
  private selected?: string;
  private headline = '';

  constructor() {
    this.dialog.setAttribute('aria-label', 'People details');
    const style = node('style', leafletCss);
    this.close.className = 'sheet-close';
    this.close.setAttribute('aria-label', 'Close People details');
    this.close.onclick = () => this.dialog.close();
    this.dialog.append(style, this.close, this.body);
    this.dialog.onclose = () => this.clearMap();
    this.dialog.onclick = event => {
      if (event.target === this.dialog) {
        const rect = this.dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.dialog.close();
      }
    };
  }

  private clearMap() {
    this.map?.remove();
    this.map = undefined;
  }

  update(members: Member[], headline: string) {
    this.members = members;
    this.headline = headline;
    if (this.dialog.open) this.draw();
  }

  open() {
    this.dialog.showModal();
    this.draw();
    this.close.focus();
  }

  private select(id: string) {
    this.selected = id;
    this.draw();
    this.body.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({ preventScroll: true });
  }

  private draw() {
    this.clearMap();
    const p = this.members.find(member => member.id === this.selected) ?? this.members[0];
    const home = this.members.filter(m => m.tone === 'home').length;
    const hero = node('header');
    hero.dataset.tone = home === 0 ? 'night' : home === this.members.length ? 'home' : 'mixed';
    hero.append(node('strong', 'People'), node('h2', this.headline));
    const out = this.members.filter(m => m.tone !== 'home');
    if (out.length) hero.append(node('span', out.map(m => m.name.split(' ')[0] + ' · ' + location(m)).join(', ')));
    this.body.replaceChildren(hero);
    if (!p) return;
    const choices = node('nav');
    choices.setAttribute('aria-label', 'Choose a person');
    for (const member of this.members) {
      const button = node('button', member.name.split(' ')[0]);
      button.setAttribute('aria-pressed', String(member === p));
      button.onclick = () => this.select(member.id);
      choices.append(button);
    }
    this.body.append(choices);
    const pins = this.members.flatMap(member => {
      const coords = point(member);
      return coords ? [{ member, coords }] : [];
    });
    if (pins.length) {
      const mapNode = node('div');
      mapNode.className = 'people-map';
      this.body.append(node('h3', 'Everyone on the map'), mapNode);
      const map = this.map = L.map(mapNode, { scrollWheelZoom: false, zoomControl: false, attributionControl: false });
      L.control.attribution({ prefix: false }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);
      map.fitBounds(L.latLngBounds(pins.map(pin => pin.coords)), { padding: [24, 24], maxZoom: 15 });
      for (const { member, coords } of pins) {
        const label = node('span', personInitials(member.name));
        label.className = member.tone === 'home' ? 'pin-home' : 'pin-away';
        const size = member === p ? 38 : 28;
        L.marker(coords, { title: member.name, zIndexOffset: member === p ? 100 : 0,
          icon: L.divIcon({ html: label, className: 'people-pin', iconSize: [size, size], iconAnchor: [size/2, size/2] })
        }).addTo(map).on('click', () => this.select(member.id));
      }
    }
    this.body.append(node('h3', p.name));
    const details = node('section');
    const row = (label: string, value: string) => {
      const line = node('p');
      line.append(node('strong', label), node('span', value));
      details.append(line);
    };
    row(p.status, location(p));
    if (age(p)) row('Last update', age(p));
    const attrs = p.attributes ?? {};
    const battery = attrs.battery_level ?? attrs.battery;
    const device = attrs.device_name || attrs.source?.replace(/^device_tracker\./, '').replaceAll('_', ' ');
    if (device || battery != null) row(device || 'Battery', battery != null ? battery + '%' : '');
    const coords = point(p);
    if (coords) {
      const link = node('a', 'Open in OpenStreetMap');
      link.href = 'https://www.openstreetmap.org/?mlat=' + coords[0] + '&mlon=' + coords[1];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      details.append(link);
    }
    this.body.append(details, node('h3', 'Everyone'));
    const list = node('section');
    for (const member of this.members) {
      const line = node('button');
      const face = node('span', personInitials(member.name));
      face.className = 'sheet-face';
      if (member.picture) {
        const img = node('img');
        img.alt = '';
        img.src = member.picture;
        img.onerror = () => img.remove();
        face.append(img);
      }
      line.append(face, node('strong', member.name), node('span', [location(member), age(member)].filter(Boolean).join(' · ')));
      line.onclick = () => this.select(member.id);
      list.append(line);
    }
    this.body.append(list);
  }
}
