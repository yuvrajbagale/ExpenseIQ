import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Motion applied to the icon. See section 22 of `styles.css`. */
export type IconAnimation =
  | 'none'
  | 'draw'
  | 'pop'
  | 'spin'
  | 'pulse'
  | 'bounce'
  | 'swing'
  | 'slide';

/** Shapes that expose `getTotalLength()` and can therefore be stroke-animated. */
const GEOMETRY = 'path, line, polyline, polygon, circle, rect, ellipse';

/**
 * Renders a registered Lucide icon with optional animation.
 *
 * ```html
 * <eiq-icon name="lucideWallet" [size]="19" anim="draw" />
 * ```
 *
 * Decorative by default (`aria-hidden`); pass `label` when the icon is the
 * only content of an interactive control.
 */
@Component({
  selector: 'eiq-icon',
  imports: [NgIcon],
  template: `<ng-icon [name]="name()" [size]="sizePx()" [strokeWidth]="strokeWidth()" />`,  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label()',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  /** Registered icon name, e.g. `lucideWallet`. */
  readonly name = input.required<string>();
  /** Edge length in pixels. */
  readonly size = input<number | string>(18);
  /** Overrides the design-system stroke width. */
  readonly strokeWidth = input<string | number | undefined>(undefined);
  /** Motion applied on hover. `spin` is continuous, the rest are one-shot. */
  readonly anim = input<IconAnimation>('none');
  /** Accessible name. Omit for decorative icons. */
  readonly label = input<string | undefined>(undefined);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly hostClass = computed(() => `eiq-icon eiq-icon--${this.anim()}`);

  /** `ng-icon` only accepts a string size. */
  readonly sizePx = computed(() => `${this.size()}`);

  constructor() {
    effect(() => {
      // Only the stroke-reveal animation needs per-shape geometry metrics.
      if (this.anim() !== 'draw') {
        return;
      }
      afterNextRender(() => this.publishShapeLengths(), { injector: this.injector });
    });
  }

  /**
   * Publishes each shape's path length as `--dash` so CSS can hide and re-reveal
   * the stroke. `getTotalLength()` is only meaningful once the SVG is in the DOM,
   * hence the `afterNextRender` hook.
   */
  private publishShapeLengths(): void {
    const shapes = Array.from(
      this.host.nativeElement.querySelectorAll<SVGGeometryElement>(GEOMETRY)
    );
    for (const shape of shapes) {
      const length = shape.getTotalLength?.();
      if (length) {
        shape.style.setProperty('--dash', length.toFixed(2));
      }
    }
  }
}
