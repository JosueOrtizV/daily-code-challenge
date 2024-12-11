import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-features',
  standalone: true,
  imports: [TranslateModule, RouterModule],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements OnInit {
  constructor(private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.translate.onLangChange.subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}
