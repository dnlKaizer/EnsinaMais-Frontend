import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlunosPageComponent } from './alunos-page.component';

describe('AlunosPageComponent', () => {
  let component: AlunosPageComponent;
  let fixture: ComponentFixture<AlunosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunosPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlunosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});