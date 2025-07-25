import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProfessorDashboardComponent } from './professor-dashboard/professor-dashboard.component';
import { MinhasTurmasComponent } from './components/minhas-turmas/minhas-turmas.component';
import { MeusAlunosComponent } from './components/meus-alunos/meus-alunos.component';
import { AvaliacoesPageComponent } from '../../components/avaliacoes-page/avaliacoes-page.component';
import { NotasPageComponent } from '../../components/notas-page/notas-page.component';

const routes: Routes = [
  { path: '', component: ProfessorDashboardComponent },
  { path: 'turmas', component: MinhasTurmasComponent },
  { path: 'alunos', component: MeusAlunosComponent },
  { path: 'avaliacoes', component: AvaliacoesPageComponent },
  { path: 'notas', component: NotasPageComponent },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProfessorDashboardComponent,
    MinhasTurmasComponent,
    MeusAlunosComponent,
    AvaliacoesPageComponent,
    NotasPageComponent,
  ],
})
export class ProfessorModule {}
