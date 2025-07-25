import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

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
  verAlunosDaTurma(turmaId: number): void {
    this.router.navigate(['/professor-dashboard/alunos'], {
      queryParams: { turmaId: turmaId },
    });
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
}
