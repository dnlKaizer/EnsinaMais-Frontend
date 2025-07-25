import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardRedirectService {
  constructor(private router: Router, private authService: AuthService) {}

  /**
   * Redireciona o usuário para o dashboard apropriado baseado em seu tipo
   */
  redirectToDashboard(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.authService.isProfessor()) {
      this.router.navigate(['/professor-dashboard']);
    } else if (this.authService.isAluno()) {
      this.router.navigate(['/aluno']);
    } else {
      // Fallback para login se não conseguir identificar o tipo
      this.router.navigate(['/login']);
    }
  }
}
