import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  matricula?: string;
  turmaId?: number;
  turma?: Turma;
  mediaAtual?: number;
}

@Component({
  selector: 'app-meus-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meus-alunos.component.html',
  styleUrl: './meus-alunos.component.css',
})
export class MeusAlunosComponent implements OnInit {
  alunos: Aluno[] = [];
  minhasTurmas: Turma[] = [];
  turmaIdSelecionada: string = '';
  turmaSelecionada: Turma | null = null;
  turmaIdFiltro: number | null = null; // Para filtrar por turma específica
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.verificarParametroTurma();
    this.carregarMinhasTurmas();
  }

  /**
   * Verifica se foi passado um ID de turma como parâmetro na query string
   */
  private verificarParametroTurma(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['turmaId']) {
        this.turmaIdFiltro = parseInt(params['turmaId'], 10);
        this.turmaIdSelecionada = params['turmaId'];
        console.log('Filtro por turma aplicado:', this.turmaIdFiltro);
      }
    });
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
   * Carrega as turmas do professor
   */
  async carregarMinhasTurmas(): Promise<void> {
    try {
      // Obter o ID do professor atual
      const professorId = await this.authService.getCurrentUserId();
      console.log('ID do professor obtido para alunos:', professorId);

      if (!professorId) {
        console.error('Não foi possível obter o ID do professor');
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
      console.log('Todas as turmas obtidas para alunos:', todasTurmas);

      // Buscar disciplinas para enriquecer os dados
      const disciplinasResponse = await this.authService.authenticatedFetch(
        '/disciplinas'
      );
      let disciplinas: any[] = [];
      if (disciplinasResponse.ok) {
        disciplinas = await disciplinasResponse.json();
        console.log('Disciplinas obtidas para alunos:', disciplinas);
      }

      // Filtrar apenas as turmas do professor atual
      let turmasDoProf = todasTurmas.filter((turma: any) => {
        console.log(
          `Comparando turma ${turma.id} para alunos: idProfessor=${turma.idProfessor} com professorId=${professorId}`
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

      this.minhasTurmas = turmasDoProf;
      console.log(
        'Turmas do professor carregadas para alunos:',
        this.minhasTurmas
      );

      await this.carregarAlunos();
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      this.minhasTurmas = [];
    }
  }

  /**
   * Carrega os alunos baseado na turma selecionada
   */
  async carregarAlunos(): Promise<void> {
    this.isLoading = true;
    try {
      // Se não temos turmas carregadas, não há alunos para carregar
      if (!this.minhasTurmas || this.minhasTurmas.length === 0) {
        console.log('Nenhuma turma do professor encontrada');
        this.alunos = [];
        this.isLoading = false;
        return;
      }

      // Carregar todos os alunos
      const alunosResponse = await this.authService.authenticatedFetch(
        '/alunos'
      );
      if (!alunosResponse.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      const todosAlunos = await alunosResponse.json();
      console.log('Todos os alunos obtidos:', todosAlunos);

      // Carregar matrículas para relacionar alunos com turmas
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      let matriculas: any[] = [];
      if (matriculasResponse.ok) {
        matriculas = await matriculasResponse.json();
        console.log('Matrículas obtidas:', matriculas);
      }

      // Filtrar alunos que estão matriculados nas turmas do professor
      const turmaIds = this.minhasTurmas.map((turma) => turma.id);
      console.log('IDs das turmas do professor:', turmaIds);

      // Obter IDs dos alunos matriculados nas turmas do professor
      const alunosMatriculados = matriculas
        .filter((matricula) => turmaIds.includes(matricula.idTurma))
        .map((matricula) => matricula.idAluno);

      console.log(
        'IDs dos alunos matriculados nas turmas do professor:',
        alunosMatriculados
      );

      // Filtrar os alunos baseado nas matrículas
      let alunosFiltrados = todosAlunos.filter((aluno: any) =>
        alunosMatriculados.includes(aluno.id)
      );

      // Enriquecer dados dos alunos com informações da turma
      alunosFiltrados = alunosFiltrados.map((aluno: any) => {
        const matricula = matriculas.find((m) => m.idAluno === aluno.id);
        const turma = this.minhasTurmas.find(
          (t) => t.id === matricula?.idTurma
        );
        return {
          ...aluno,
          turmaId: matricula?.idTurma,
          turma: turma,
        };
      });

      // Se uma turma específica foi selecionada (dropdown ou parâmetro), filtrar ainda mais
      if (this.turmaIdSelecionada) {
        const turmaId = parseInt(this.turmaIdSelecionada);
        alunosFiltrados = alunosFiltrados.filter(
          (aluno: any) => aluno.turmaId === turmaId
        );
        this.turmaSelecionada =
          this.minhasTurmas.find((t) => t.id === turmaId) || null;
      } else if (this.turmaIdFiltro) {
        // Aplicar filtro vindo do dashboard
        alunosFiltrados = alunosFiltrados.filter(
          (aluno: any) => aluno.turmaId === this.turmaIdFiltro
        );
        this.turmaSelecionada =
          this.minhasTurmas.find((t) => t.id === this.turmaIdFiltro) || null;
      } else {
        this.turmaSelecionada = null;
      }

      this.alunos = alunosFiltrados;
      console.log('Alunos do professor carregados (final):', this.alunos);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      this.alunos = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handler para mudança de turma no select
   */
  async onTurmaChange(): Promise<void> {
    await this.carregarAlunos();
  }

  /**
   * Retorna a classe CSS baseada na média do aluno
   */
  getClasseMedia(media?: number): string {
    if (!media) return '';
    if (media >= 7) return 'media-alta';
    if (media >= 5) return 'media-media';
    return 'media-baixa';
  }

  /**
   * Navega para os detalhes do aluno
   */
  verDetalhes(alunoId: number): void {
    this.router.navigate(['/professor-dashboard/aluno-detalhes', alunoId]);
  }

  /**
   * Navega para gerenciar notas do aluno
   */
  gerenciarNotas(alunoId: number, turmaId: number): void {
    this.router.navigate(['/professor-dashboard/minhas-notas', turmaId], {
      queryParams: { alunoId },
    });
  }
}
