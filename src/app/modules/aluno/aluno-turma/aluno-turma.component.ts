import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

// Interface para os dados do Professor
interface Professor {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  titulacao: string;
}

// Interface para os dados da matrícula-turma
interface MatriculaTurma {
  id: number;
  situacao: number;
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

// Interface para os dados da avaliação
interface Avaliacao {
  id: number;
  data: string;
  descricao: string;
  notaMaxima: number;
  idTurma: number;
}

// Interface para os dados da nota
interface Nota {
  id: number;
  nota: number;
  idAvaliacao: number;
  idMatriculaTurma: number;
}

@Component({
  selector: 'app-aluno-turma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aluno-turma.component.html',
  styleUrl: './aluno-turma.component.css'
})
export class AlunoTurmaComponent implements OnInit {
  aluno: Aluno | null = null;
  disciplina: Disciplina | null = null;
  professor: Professor | null = null;
  matriculaTurma: MatriculaTurma | null = null;
  turma: Turma | null = null;
  avaliacoes: Avaliacao[] = [];
  notas: Nota[] = [];

  username: string = '';
  matriculaTurmaId: number = 0;
  isLoading: boolean = false;
  errorMessage: string | null = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.username = authService.getUsername() || '';
  }

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    // Obter o ID da matrícula-turma da query string
    this.route.queryParams.subscribe(params => {
      this.matriculaTurmaId = +params['matriculaTurmaId'] || 0;
      if (this.matriculaTurmaId > 0) {
        this.carregar();
      } else {
        this.errorMessage = 'ID da matrícula-turma não fornecido';
      }
    });
  }

  /**
   * Busca todos os dados relacionados à turma específica
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.carregarAluno();
      await this.carregarMatriculaTurma();
      
      // Só carrega os outros dados se a matrícula-turma foi encontrada
      if (this.matriculaTurma) {
        await this.carregarTurma();
        await this.carregarDisciplina();
        await this.carregarProfessor();
        await this.carregarAvaliacoes();
        await this.carregarNotas();
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da turma:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  private async carregarAluno(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/usuario/login/${this.username}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.aluno = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar dados do aluno: ' + error.message);
    }
  }

  private async carregarMatriculaTurma(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Matrícula-turma não encontrada');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.matriculaTurma = await response.json();
      console.log('Matrícula-turma carregada:', this.matriculaTurma);
    } catch (error: any) {
      console.error('Erro detalhado ao carregar matrícula-turma:', error);
      throw new Error('Erro ao carregar matrícula-turma: ' + error.message);
    }
  }

  private async carregarTurma(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}/turma`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.turma = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar turma: ' + error.message);
    }
  }

  private async carregarDisciplina(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}/disciplina`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.disciplina = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar disciplina: ' + error.message);
    }
  }

  private async carregarProfessor(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}/professor`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.professor = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar professor: ' + error.message);
    }
  }

  private async carregarAvaliacoes(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}/avaliacoes`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.avaliacoes = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar avaliações: ' + error.message);
    }
  }

  private async carregarNotas(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(`/alunos/${this.aluno?.id}/matriculas-turmas/${this.matriculaTurmaId}/notas`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      this.notas = await response.json();
    } catch (error: any) {
      throw new Error('Erro ao carregar notas: ' + error.message);
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
   * Volta para o dashboard do aluno
   */
  voltarDashboard(): void {
    this.router.navigate(['/aluno']);
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
   * Obtém a nota de uma avaliação específica
   */
  getNotaPorAvaliacao(avaliacaoId: number): number | null {
    const nota = this.notas.find(n => n.idAvaliacao === avaliacaoId);
    return nota ? nota.nota : null;
  }

  /**
   * Obtém a avaliação pelo índice
   */
  getAvaliacaoByIndex(index: number): Avaliacao | null {
    return this.avaliacoes[index] || null;
  }
}
