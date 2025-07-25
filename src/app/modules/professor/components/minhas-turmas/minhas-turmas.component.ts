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
  disciplina?: Disciplina; // Opcional, será preenchido depois
  totalAlunos?: number;
}

@Component({
  selector: 'app-minhas-turmas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minhas-turmas.component.html',
  styleUrl: './minhas-turmas.component.css',
})
export class MinhasTurmasComponent implements OnInit {
  turmas: Turma[] = [];
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Debug: mostrar informações do token
    this.authService.debugTokenInfo();
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
   * Volta para o dashboard do professor
   */
  voltarDashboard(): void {
    this.router.navigate(['/professor-dashboard']);
  }

  /**
   * Carrega as turmas do professor logado
   */
  async carregarMinhasTurmas(): Promise<void> {
    this.isLoading = true;
    try {
      // Obter o ID do professor atual
      const professorId = await this.authService.getCurrentUserId();
      console.log('ID do professor obtido:', professorId);

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
      console.log('Todas as turmas obtidas:', todasTurmas);

      // Buscar disciplinas para enriquecer os dados
      const disciplinasResponse = await this.authService.authenticatedFetch(
        '/disciplinas'
      );
      let disciplinas: any[] = [];
      if (disciplinasResponse.ok) {
        disciplinas = await disciplinasResponse.json();
        console.log('Disciplinas obtidas:', disciplinas);
      }

      // Filtrar apenas as turmas do professor atual
      let turmasDoProf = todasTurmas.filter((turma: any) => {
        console.log(
          `Comparando turma ${turma.id}: idProfessor=${turma.idProfessor} com professorId=${professorId}`
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
      console.log('Turmas do professor carregadas:', this.turmas);
    } catch (error) {
      console.error('Erro ao carregar turmas do professor:', error);
      // Fallback para dados mockados em caso de erro
      this.turmas = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Navega para a página de alunos da turma específica
   */
  verAlunos(turmaId: number): void {
    this.router.navigate(['/professor-dashboard/meus-alunos', turmaId]);
  }

  /**
   * Navega para criar uma nova avaliação para a turma
   */
  criarAvaliacao(turmaId: number): void {
    this.router.navigate([
      '/professor-dashboard/minhas-avaliacoes/criar',
      turmaId,
    ]);
  }

  /**
   * Navega para gerenciar notas da turma
   */
  verNotas(turmaId: number): void {
    this.router.navigate(['/professor-dashboard/minhas-notas', turmaId]);
  }
}
