import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurmasPageComponent } from './turmas-page.component';

describe('TurmasPageComponent', () => {
  let component: TurmasPageComponent;
  let fixture: ComponentFixture<TurmasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurmasPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TurmasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
