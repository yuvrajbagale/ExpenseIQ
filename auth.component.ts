import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import gsap from 'gsap';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements AfterViewInit {
  @ViewChild('panel') panel!: ElementRef;
  @ViewChild('side') side!: ElementRef;

  mode: 'login' | 'signup' = 'login';
  name = '';
  email = '';
  password = '';
  submitting = false;

  constructor(private router: Router, private route: ActivatedRoute) {
    const qMode = this.route.snapshot.queryParamMap.get('mode');
    if (qMode === 'signup' || qMode === 'login') this.mode = qMode;
  }

  ngAfterViewInit(): void {
    // GSAP Animation 2 of 3 — auth panel entrance
    // The ledger side-panel slides in from the left, the form slides in from the
    // right, and they meet in the middle like two halves of a ledger book opening.
    gsap.set(this.side.nativeElement, { opacity: 0, x: -40 });
    gsap.set(this.panel.nativeElement, { opacity: 0, x: 40 });

    gsap
      .timeline({ defaults: { duration: 0.7, ease: 'power3.out' } })
      .to(this.side.nativeElement, { opacity: 1, x: 0 })
      .to(this.panel.nativeElement, { opacity: 1, x: 0 }, '-=0.5');
  }

  switchMode(mode: 'login' | 'signup'): void {
    this.mode = mode;
  }

  submit(): void {
    // Dummy auth — no backend call. Any input is accepted and the user is
    // routed straight into the dashboard, per the requested flow.
    this.submitting = true;
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 450);
  }
}
