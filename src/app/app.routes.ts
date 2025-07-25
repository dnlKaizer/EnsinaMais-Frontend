import { Routes } from '@angular/router';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { AdminGuard } from './guards/admin.guard';
import { ProfessorGuard } from './guards/professor.guard';
import { AlunoDashboardComponent } from './modules/aluno/aluno-dashboard/aluno-dashboard.component';
import { AlunoTurmaComponent } from './modules/aluno/aluno-turma/aluno-turma.component';

export const routes: Routes = [
  // Rota padrão - redireciona para login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rota para a página de login
  { path: 'login', component: LoginPageComponent },

  // Rotas para dashboards específicos por tipo de usuário
  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },
  {
    path: 'professor-dashboard',
    loadChildren: () =>
      import('./modules/professor/professor.module').then(
        (m) => m.ProfessorModule
      ),
    canActivate: [ProfessorGuard],
  },

  // Rota para o módulo do aluno
  { path: 'aluno', component: AlunoDashboardComponent },

  // Rota para a turma selecionada pelo aluno
  { path: 'aluno/turma', component: AlunoTurmaComponent },

  // Rota para páginas não encontradas
  { path: '**', redirectTo: '/login' },
];
