import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasAvaliacoesComponent } from './minhas-avaliacoes.component';

describe('MinhasAvaliacoesComponent', () => {
  let component: MinhasAvaliacoesComponent;
  let fixture: ComponentFixture<MinhasAvaliacoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasAvaliacoesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasAvaliacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
