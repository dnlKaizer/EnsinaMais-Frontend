import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
}

interface Turma {
  id: number;
  semestre: string;
  vagas: number;
  idDisciplina: number;
  idProfessor: number;
  disciplina?: Disciplina;
  totalAlunos?: number;
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
}

interface MatriculaTurma {
  idMatricula: number;
  idTurma: number;
  situacao: number;
}

@Component({
  selector: 'app-professor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professor-dashboard.component.html',
  styleUrl: './professor-dashboard.component.css',
})
export class ProfessorDashboardComponent implements OnInit {
  turmas: Turma[] = [];
  isLoading = false;

  // Propriedades do modal de alunos
  showAlunosModal = false;
  alunosDaTurma: Aluno[] = [];
  turmaSelecionada: Turma | null = null;
  isLoadingAlunos = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.carregarMinhasTurmas();
  }

  /**
   * Executa o logout do usuário e redireciona para a página de login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navega para a página inicial
   */
  home(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Carrega as turmas do professor logado
   */
  async carregarMinhasTurmas(): Promise<void> {
    this.isLoading = true;
    try {
      // Obter o ID do professor atual
      const professorId = await this.authService.getCurrentUserId();
      console.log('ID do professor obtido no dashboard:', professorId);

      if (!professorId) {
        console.error('Não foi possível obter o ID do professor');
        this.isLoading = false;
        return;
      }

      // Fazer requisição para buscar todas as turmas
      const turmasResponse = await this.authService.authenticatedFetch(
        '/turmas'
      );

      if (!turmasResponse.ok) {
        throw new Error(
          `Erro ${turmasResponse.status}: ${turmasResponse.statusText}`
        );
      }

      const todasTurmas = await turmasResponse.json();
      console.log('Todas as turmas obtidas no dashboard:', todasTurmas);

      // Buscar disciplinas para enriquecer os dados
      const disciplinasResponse = await this.authService.authenticatedFetch(
        '/disciplinas'
      );
      let disciplinas: any[] = [];
      if (disciplinasResponse.ok) {
        disciplinas = await disciplinasResponse.json();
        console.log('Disciplinas obtidas no dashboard:', disciplinas);
      }

      // Filtrar apenas as turmas do professor atual
      let turmasDoProf = todasTurmas.filter((turma: any) => {
        console.log(
          `Dashboard - Comparando turma ${turma.id}: idProfessor=${turma.idProfessor} com professorId=${professorId}`
        );
        return turma.idProfessor === professorId;
      });

      // Enriquecer turmas com dados das disciplinas
      turmasDoProf = turmasDoProf.map((turma: any) => {
        const disciplina = disciplinas.find((d) => d.id === turma.idDisciplina);
        return {
          ...turma,
          disciplina: disciplina || {
            id: turma.idDisciplina,
            nome: 'Disciplina não encontrada',
            codigo: 'N/A',
          },
        };
      });

      this.turmas = turmasDoProf;
      console.log('Turmas do professor carregadas no dashboard:', this.turmas);
    } catch (error) {
      console.error(
        'Erro ao carregar turmas do professor no dashboard:',
        error
      );
      this.turmas = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Navega para a página de alunos de uma turma específica
   */
  async verAlunosDaTurma(turmaId: number): Promise<void> {
    const turma = this.turmas.find((t) => t.id === turmaId);
    if (!turma) {
      console.error('Turma não encontrada');
      return;
    }

    this.turmaSelecionada = turma;
    this.isLoadingAlunos = true;
    this.showAlunosModal = true;

    try {
      await this.carregarAlunosDaTurma(turmaId);
    } catch (error) {
      console.error('Erro ao carregar alunos da turma:', error);
      this.alunosDaTurma = [];
    } finally {
      this.isLoadingAlunos = false;
    }
  }

  /**
   * Carrega os alunos matriculados em uma turma específica
   */
  async carregarAlunosDaTurma(turmaId: number): Promise<void> {
    try {
      // Carregar todas as matrículas da turma
      const matriculasTurmaResponse = await this.authService.authenticatedFetch(
        '/matriculas-turmas'
      );
      if (!matriculasTurmaResponse.ok) {
        throw new Error('Erro ao carregar matrículas da turma');
      }
      const matriculasTurma = await matriculasTurmaResponse.json();

      // Filtrar matrículas desta turma específica
      const matriculasDestaTurma = matriculasTurma.filter(
        (mt: any) => mt.idTurma === turmaId
      );

      if (matriculasDestaTurma.length === 0) {
        this.alunosDaTurma = [];
        return;
      }

      // Carregar todas as matrículas para mapear ID da matrícula para ID do aluno
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      if (!matriculasResponse.ok) {
        throw new Error('Erro ao carregar matrículas');
      }
      const matriculas = await matriculasResponse.json();

      // Carregar todos os alunos
      const alunosResponse = await this.authService.authenticatedFetch(
        '/alunos'
      );
      if (!alunosResponse.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      const todosAlunos = await alunosResponse.json();

      // Mapear IDs das matrículas para IDs dos alunos
      const idsMatriculasDestaTurma = matriculasDestaTurma.map(
        (mt: any) => mt.idMatricula
      );
      const idsAlunosDestaTurma = matriculas
        .filter((m: any) => idsMatriculasDestaTurma.includes(m.id))
        .map((m: any) => m.idAluno);

      // Filtrar alunos que estão matriculados nesta turma
      this.alunosDaTurma = todosAlunos.filter((aluno: Aluno) =>
        idsAlunosDestaTurma.includes(aluno.id)
      );

      console.log('Alunos carregados para a turma:', this.alunosDaTurma);
    } catch (error) {
      console.error('Erro ao carregar alunos da turma:', error);
      this.alunosDaTurma = [];
    }
  }

  /**
   * Fecha o modal de alunos
   */
  fecharModalAlunos(): void {
    this.showAlunosModal = false;
    this.alunosDaTurma = [];
    this.turmaSelecionada = null;
    this.isLoadingAlunos = false;
  }

  /**
   * Navega para a página de avaliações de uma turma específica
   */
  gerenciarAvaliacoes(turmaId: number): void {
    this.router.navigate(['/professor-dashboard/avaliacoes'], {
      queryParams: { turmaId: turmaId },
    });
  }

  /**
   * Navega para a página de notas de uma turma específica
   */
  gerenciarNotas(turmaId: number): void {
    this.router.navigate(['/professor-dashboard/notas'], {
      queryParams: { turmaId: turmaId },
    });
  }

  /**
   * TrackBy function para melhorar performance da *ngFor
   */
  trackByTurmaId(index: number, turma: Turma): number {
    return turma.id;
  }
}
