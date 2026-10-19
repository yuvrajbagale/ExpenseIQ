import { Component, signal } from '@angular/core';

@Component({
  selector: 'eiq-settings-currency',
  standalone: true,
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Currency & Language</h3>
          <p class="eiq-card__subtitle">Regional and formatting preferences</p>
        </div>
      </div>
      <div class="settings-form">
        <div class="settings-field">
          <label class="settings-field__label" for="primCur">Primary Currency</label>
          <select id="primCur" class="settings-select" [value]="primary()" (change)="primary.set(inputValue($event))">
            <option value="USD $">USD $</option>
            <option value="EUR â‚¬">EUR â‚¬</option>
            <option value="GBP Â£">GBP Â£</option>
            <option value="INR â‚¹">INR â‚¹</option>
            <option value="JPY Â¥">JPY Â¥</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="secCur">Secondary Currency</label>
          <select id="secCur" class="settings-select" [value]="secondary()" (change)="secondary.set(inputValue($event))">
            <option value="EUR â‚¬">EUR â‚¬</option>
            <option value="USD $">USD $</option>
            <option value="GBP Â£">GBP Â£</option>
            <option value="None">None</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="language">Language</label>
          <select id="language" class="settings-select" [value]="language()" (change)="language.set(inputValue($event))">
            <option value="English">English</option>
            <option value="EspaÃ±ol">EspaÃ±ol</option>
            <option value="FranÃ§ais">FranÃ§ais</option>
            <option value="Deutsch">Deutsch</option>
            <option value="à¤¹à¤¿à¤¨à¥à¤¦à¥€">à¤¹à¤¿à¤¨à¥à¤¦à¥€</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="numFormat">Number Format</label>
          <select id="numFormat" class="settings-select" [value]="numberFormat()" (change)="numberFormat.set(inputValue($event))">
            <option value="1,234.56">1,234.56</option>
            <option value="1.234,56">1.234,56</option>
            <option value="1 234.56">1 234.56</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="tz">Timezone</label>
          <select id="tz" class="settings-select" [value]="timezone()" (change)="timezone.set(inputValue($event))">
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; padding: 1.25rem; }
    .settings-field__label { font-size: 0.8125rem; font-weight: 500; color: var(--eiq-muted); margin-bottom: 0.375rem; display: block; }
    .settings-select {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--eiq-border);
      border-radius: 8px; font-size: 0.875rem; background: var(--eiq-input-bg);
      color: var(--eiq-foreground); outline: none;
    }
    .settings-select:focus { border-color: var(--eiq-primary); }
  `],
})
export class SettingsCurrencyTabComponent {
  primary = signal('USD $');
  secondary = signal('EUR â‚¬');
  language = signal('English');
  numberFormat = signal('1,234.56');
  timezone = signal('America/New_York');

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
