import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessoresPageComponent } from './professores-page.component';

describe('ProfessoresPageComponent', () => {
  let component: ProfessoresPageComponent;
  let fixture: ComponentFixture<ProfessoresPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessoresPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfessoresPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
