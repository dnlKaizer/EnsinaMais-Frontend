import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlunoDashboardComponent } from './aluno-dashboard.component';

describe('AlunoDashboardComponent', () => {
  let component: AlunoDashboardComponent;
  let fixture: ComponentFixture<AlunoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlunoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
