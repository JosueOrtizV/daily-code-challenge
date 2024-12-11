import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { faqs } from './faqs';

@Component({
  selector: 'app-faq-support',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './faq-support.component.html',
  styleUrls: ['./faq-support.component.css']
})
export class FaqSupportComponent implements OnInit {
  faqs = faqs;
  expandedIndex: number | null = null;

  constructor() {}

  ngOnInit(): void {}

  toggleAccordion(index: number): void {
    if (this.expandedIndex === index) {
      this.expandedIndex = null;
    } else {
      this.expandedIndex = index;
    }
  }
}
