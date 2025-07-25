import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisciplinasPageComponent } from './disciplinas-page.component';

describe('DisciplinasPageComponent', () => {
  let component: DisciplinasPageComponent;
  let fixture: ComponentFixture<DisciplinasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisciplinasPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DisciplinasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
