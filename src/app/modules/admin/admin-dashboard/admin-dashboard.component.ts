import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Executa o logout do usuário e redireciona para a página de login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToAlunosPage() {
    this.router.navigate(['/admin-dashboard/alunos']);
  }

  goToProfessoresPage() {
    this.router.navigate(['/admin-dashboard/professores']);
  }

  goToTurmasPage() {
    this.router.navigate(['/admin-dashboard/turmas']);
  }

  goToDisciplinasPage() {
    this.router.navigate(['/admin-dashboard/disciplinas']);
  }

  goToNotasPage() {
    this.router.navigate(['/admin-dashboard/notas']);
  }

  goToAvaliacoesPage() {
    this.router.navigate(['/admin-dashboard/avaliacoes']);
  }

  goToMatriculasPage() {
    this.router.navigate(['/admin-dashboard/matriculas']);
  }
}
