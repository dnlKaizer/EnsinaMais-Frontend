import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasNotasComponent } from './minhas-notas.component';

describe('MinhasNotasComponent', () => {
  let component: MinhasNotasComponent;
  let fixture: ComponentFixture<MinhasNotasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasNotasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasNotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
