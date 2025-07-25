import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlunoTurmaComponent } from './aluno-turma.component';

describe('AlunoTurmaComponent', () => {
  let component: AlunoTurmaComponent;
  let fixture: ComponentFixture<AlunoTurmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlunoTurmaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlunoTurmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
