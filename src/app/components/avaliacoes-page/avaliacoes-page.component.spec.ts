import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvaliacoesPageComponent } from './avaliacoes-page.component';

describe('AvaliacoesPageComponent', () => {
  let component: AvaliacoesPageComponent;
  let fixture: ComponentFixture<AvaliacoesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaliacoesPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AvaliacoesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
