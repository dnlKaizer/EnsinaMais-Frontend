import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatriculasPageComponent } from './matriculas-page.component';

describe('MatriculasPageComponent', () => {
  let component: MatriculasPageComponent;
  let fixture: ComponentFixture<MatriculasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatriculasPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatriculasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
