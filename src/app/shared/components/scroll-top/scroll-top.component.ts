import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.css']
})
export class ScrollTopComponent {
  private isVisible = false;
  
  constructor() {
    this.onScroll();
  }
  
  getStyle() {
    return {
      display: this.isVisible ? 'flex' : 'none'
    };
  }
  
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.isVisible = document.body.scrollTop > 50 || document.documentElement.scrollTop > 50;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
