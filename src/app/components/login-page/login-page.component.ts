import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardRedirectService } from '../../services/dashboard-redirect.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  login: string = '';
  senha: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardRedirectService: DashboardRedirectService
  ) {
    // Função executada antes de carregar a página
    this.inicializarPagina();
  }

  private navegar() {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/home']);
    } else if (this.authService.isProfessor()) {
      this.router.navigate(['/professor']);
    } else if (this.authService.isAluno()) {
      this.router.navigate(['/aluno']);
    }
  }

  // Função que executa antes da página carregar
  private inicializarPagina() {
    // Verificar se usuário já está logado
    if (this.authService.isLoggedIn()) {
      console.log('Usuário já está logado, redirecionando...');
      this.dashboardRedirectService.redirectToDashboard();
      return;
    }
    // Limpar dados anteriores
    this.authService.logout();
  }

  // Função de autenticar Login
  async autenticar() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.authService.login({
        login: this.login,
        senha: this.senha,
      });

      // Armazenar o token e tipo do token
      this.authService.saveToken(response.acessToken);
      this.authService.saveTokenType(response.tokenType);

      // Salvar dados básicos do usuário (já que não vem na resposta)
      this.authService.saveUser({
        login: this.login,
        // Outros dados podem ser obtidos posteriormente via API
      });

      // Redirecionar para o dashboard apropriado
      this.dashboardRedirectService.redirectToDashboard();

      console.log('Login realizado com sucesso!', response);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      this.errorMessage = 'Erro de conexão. Verifique se a API está rodando.';
    } finally {
      this.isLoading = false;
    }
  }

  // Função para limpar mensagens de erro quando o usuário digitar
  clearError() {
    this.errorMessage = '';
  }
}
