import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

// Interface para os dados do aluno
interface Aluno {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  dataNascimento: string;
}

// Interface para os dados da Disciplina
interface Disciplina {
  id: number;
  nome: string;
}

// Interface para os dados da matrícula
interface Matricula {
  id: number;
  numero: string;
  data: string;
  idAluno: number;
}

// Interface para os dados da matrícula-turma
interface MatriculaTurma {
  id: number;
  situacao: number; // Código numérico da situação (0=Reprovado, 1=Aprovado, 2=Em Andamento)
  notaFinal: number;
  idMatricula: number;
  idTurma: number;
}

// Interface para os dados da turma
interface Turma {
  id: number;
  semestre: string;
  vagas: number;
  idDisciplina: number;
  idProfessor: number;
}

@Component({
  selector: 'app-aluno-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aluno-dashboard.component.html',
  styleUrl: './aluno-dashboard.component.css'
})
export class AlunoDashboardComponent {
  aluno: Aluno | null = null;
  disciplinas: Disciplina[] = [];
  matriculas: Matricula[] = [];
  matriculaTurmas: MatriculaTurma[] = [];
  turmas: Turma[] = [];

  username: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = '';

  constructor(private authService: AuthService, private router: Router) {
    this.username = authService.getUsername() || '';
  }

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    await this.carregar();
  }

  /**
   * Busca a lista de alunos na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    await this.carregarAluno();
    await this.carregarMatricula();
    await this.carregarMatriculaTurma();
    await this.carregarTurma();
    await this.carregarDisciplina();
  }

  private async carregarAluno(): Promise<void> {
    // Carregar aluno
    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch(`/alunos/usuario/login/${this.username}`);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      this.aluno = await response.json();

      console.log('Aluno carregado:', this.aluno);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  private async carregarMatricula(): Promise<void> {
    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas`);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      this.matriculas = await response.json();

      console.log('Matrículas carregadas:', this.matriculas);
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  private async carregarMatriculaTurma(): Promise<void> {
    try {
      // Usar Promise.all com map para aguardar todas as requisições
      const promises = this.matriculas.map(async matricula => {
        // Fazer requisição GET autenticada
        const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas/${matricula.id}/matriculas-turmas`);
  
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
  
        // Converter resposta para JSON
        const jsonResponse = await response.json();
        return jsonResponse;
      });

      // Aguardar todas as promessas e achatar o array (já que cada resposta pode ser um array)
      const results = await Promise.all(promises);
      this.matriculaTurmas = results.flat(); // flat() para achatar arrays aninhados

      console.log('Matrículas-Turmas carregadas:', this.matriculaTurmas);
    } catch (error: any) {
      console.error('Erro ao carregar matrículas-turmas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  private async carregarTurma(): Promise<void> {
    try {
      // Usar Promise.all com map para aguardar todas as requisições
      const promises = this.matriculaTurmas.map(async matriculaTurma => {
        // Fazer requisição GET autenticada
        const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${matriculaTurma.id}/turma`);
  
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
  
        // Converter resposta para JSON
        const jsonResponse = await response.json();
        return jsonResponse;
      });

      // Aguardar todas as promessas
      const results = await Promise.all(promises);
      this.turmas = results;

      console.log('Turmas carregadas:', this.turmas);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  private async carregarDisciplina(): Promise<void> {
    try {
      // Usar Promise.all com map para aguardar todas as requisições
      const promises = this.matriculaTurmas.map(async matriculaTurma => {
        // Fazer requisição GET autenticada
        const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${matriculaTurma.id}/disciplina`);
  
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
  
        // Converter resposta para JSON
        const jsonResponse = await response.json();
        return jsonResponse;
      });

      // Aguardar todas as promessas
      const results = await Promise.all(promises);
      this.disciplinas = results;

      console.log('Disciplinas carregadas:', this.disciplinas);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Faz logout do usuário
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Obtém o semestre da turma pelo índice
   */
  getTurmaBySemestre(index: number): string {
    if (this.turmas && this.turmas[index]) {
      return this.turmas[index].semestre;
    }
    return '-';
  }

  /**
   * Obtém o nome da disciplina pelo índice
   */
  getDisciplinaByIndex(index: number): string {
    if (this.disciplinas && this.disciplinas[index]) {
      return this.disciplinas[index].nome;
    }
    return '-';
  }

  /**
   * Converte o código da situação para texto legível
   */
  getSituacaoTexto(situacao: number): string {
    switch (situacao) {
      case 0:
        return 'Reprovado';
      case 1:
        return 'Aprovado';
      case 2:
        return 'Em Andamento';
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Navega para a página de detalhes da turma
   */
  navegarParaTurma(matriculaTurmaId: number): void {
    this.router.navigate(['/aluno/turma'], {
      queryParams: { matriculaTurmaId: matriculaTurmaId }
    });
  }
}