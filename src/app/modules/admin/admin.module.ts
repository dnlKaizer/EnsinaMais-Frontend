import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ProfessoresPageComponent } from '../../components/professores-page/professores-page.component';
import { AlunosPageComponent } from '../../components/alunos-page/alunos-page.component';
import { AvaliacoesPageComponent } from '../../components/avaliacoes-page/avaliacoes-page.component';
import { MatriculasPageComponent } from '../../components/matriculas-page/matriculas-page.component';
import { TurmasPageComponent } from '../../components/turmas-page/turmas-page.component';
import { DisciplinasPageComponent } from '../../components/disciplinas-page/disciplinas-page.component';
import { NotasPageComponent } from '../../components/notas-page/notas-page.component';

const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'professores', component: ProfessoresPageComponent },
  { path: 'alunos', component: AlunosPageComponent },
  { path: 'avaliacoes', component: AvaliacoesPageComponent },
  { path: 'matriculas', component: MatriculasPageComponent },
  { path: 'turmas', component: TurmasPageComponent },
  { path: 'disciplinas', component: DisciplinasPageComponent },
  { path: 'notas', component: NotasPageComponent },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AdminDashboardComponent,
    ProfessoresPageComponent,
    AlunosPageComponent,
    AvaliacoesPageComponent,
    MatriculasPageComponent,
    TurmasPageComponent,
    DisciplinasPageComponent,
    NotasPageComponent,
  ],
})
export class AdminModule {}
