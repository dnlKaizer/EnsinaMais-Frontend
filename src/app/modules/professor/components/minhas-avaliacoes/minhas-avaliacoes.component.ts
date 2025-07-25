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
  codigo: string;
  periodo: string;
  disciplina: Disciplina;
}

interface Avaliacao {
  id: number;
  nome: string;
  tipo: 'Prova' | 'Trabalho' | 'Exercício' | 'Projeto';
  data: Date;
  valorTotal: number;
  turmaId: number;
  turma: Turma;
  status: 'Agendada' | 'Ativa' | 'Encerrada';
  descricao?: string;
}

@Component({
  selector: 'app-minhas-avaliacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minhas-avaliacoes.component.html',
  styleUrl: './minhas-avaliacoes.component.css',
})
export class MinhasAvaliacoesComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  minhasTurmas: Turma[] = [];
  turmaIdSelecionada: string = '';
  turmaIdFiltro: number | null = null; // Para filtrar por turma específica
  turmaFixa: boolean = false; // Para indicar se a turma está fixa (não pode ser alterada)
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
   * Verifica se foi passado um ID de turma como parâmetro na query string ou na rota
   */
  private verificarParametroTurma(): void {
    // Verificar query parameters (vindo do dashboard)
    this.route.queryParams.subscribe((params) => {
      if (params['turmaId']) {
        this.turmaIdFiltro = parseInt(params['turmaId'], 10);
        this.turmaIdSelecionada = params['turmaId'];
        this.turmaFixa = true;
        console.log(
          'Filtro por turma aplicado nas avaliações:',
          this.turmaIdFiltro
        );
      }
    });

    // Verificar route parameters (URLs como /avaliacoes/criar/123)
    const turmaIdParam = this.route.snapshot.paramMap.get('turmaId');
    if (turmaIdParam) {
      this.turmaIdFiltro = parseInt(turmaIdParam, 10);
      this.turmaIdSelecionada = turmaIdParam;
      this.turmaFixa = true;
      console.log('Turma fixa aplicada nas avaliações:', this.turmaIdFiltro);
    }
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
      // TODO: Implementar chamada para a API
      this.minhasTurmas = [
        {
          id: 1,
          codigo: 'MAT101-2024.1',
          periodo: '2024.1',
          disciplina: { id: 1, nome: 'Matemática I', codigo: 'MAT101' },
        },
        {
          id: 2,
          codigo: 'FIS201-2024.1',
          periodo: '2024.1',
          disciplina: { id: 2, nome: 'Física II', codigo: 'FIS201' },
        },
      ];
      await this.carregarAvaliacoes();
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }

  /**
   * Carrega as avaliações baseado na turma selecionada
   */
  async carregarAvaliacoes(): Promise<void> {
    this.isLoading = true;
    try {
      // TODO: Implementar chamada para a API
      const todasAvaliacoes: Avaliacao[] = [
        {
          id: 1,
          nome: 'Prova 1 - Funções',
          tipo: 'Prova',
          data: new Date('2024-03-15'),
          valorTotal: 10,
          turmaId: 1,
          turma: this.minhasTurmas[0],
          status: 'Encerrada',
        },
        {
          id: 2,
          nome: 'Trabalho - Limites',
          tipo: 'Trabalho',
          data: new Date('2024-04-20'),
          valorTotal: 8,
          turmaId: 1,
          turma: this.minhasTurmas[0],
          status: 'Ativa',
        },
        {
          id: 3,
          nome: 'Prova 1 - Cinemática',
          tipo: 'Prova',
          data: new Date('2024-03-22'),
          valorTotal: 10,
          turmaId: 2,
          turma: this.minhasTurmas[1],
          status: 'Encerrada',
        },
      ];

      // Aplicar filtro por turma específica (vindo do dashboard ou parâmetro)
      if (this.turmaIdFiltro) {
        this.avaliacoes = todasAvaliacoes.filter(
          (avaliacao) => avaliacao.turmaId === this.turmaIdFiltro
        );
        console.log(
          `Avaliações filtradas para turma ${this.turmaIdFiltro}:`,
          this.avaliacoes
        );
      } else if (this.turmaIdSelecionada) {
        this.avaliacoes = todasAvaliacoes.filter(
          (avaliacao) => avaliacao.turmaId === parseInt(this.turmaIdSelecionada)
        );
      } else {
        this.avaliacoes = todasAvaliacoes;
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handler para mudança de turma no select
   */
  async onTurmaChange(): Promise<void> {
    await this.carregarAvaliacoes();
  }

  /**
   * Retorna a classe CSS baseada no tipo da avaliação
   */
  getClasseTipo(tipo: string): string {
    switch (tipo) {
      case 'Prova':
        return 'bg-prova text-white';
      case 'Trabalho':
        return 'bg-trabalho text-white';
      case 'Exercício':
        return 'bg-exercicio text-white';
      case 'Projeto':
        return 'bg-projeto text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  /**
   * Retorna a classe CSS baseada no status da avaliação
   */
  getClasseStatus(status: string): string {
    switch (status) {
      case 'Ativa':
        return 'bg-ativa text-white';
      case 'Encerrada':
        return 'bg-encerrada text-white';
      case 'Agendada':
        return 'bg-agendada text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  /**
   * Navega para criar nova avaliação
   */
  novaAvaliacao(): void {
    if (this.turmaIdFiltro) {
      // Se há uma turma específica, passar como parâmetro
      this.router.navigate(['/professor-dashboard/minhas-avaliacoes/criar'], {
        queryParams: { turmaId: this.turmaIdFiltro },
      });
    } else {
      this.router.navigate(['/professor-dashboard/minhas-avaliacoes/criar']);
    }
  }

  /**
   * Navega para editar avaliação
   */
  editarAvaliacao(avaliacaoId: number): void {
    this.router.navigate([
      '/professor-dashboard/minhas-avaliacoes/editar',
      avaliacaoId,
    ]);
  }

  /**
   * Navega para lançar notas da avaliação
   */
  lancarNotas(avaliacaoId: number): void {
    this.router.navigate([
      '/professor-dashboard/avaliacoes-notas',
      avaliacaoId,
    ]);
  }

  /**
   * Navega para ver resultados da avaliação
   */
  verResultados(avaliacaoId: number): void {
    this.router.navigate([
      '/professor-dashboard/avaliacoes-resultados',
      avaliacaoId,
    ]);
  }

  /**
   * Exclui a avaliação
   */
  async excluirAvaliacao(avaliacaoId: number): Promise<void> {
    if (
      confirm(
        'Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.'
      )
    ) {
      try {
        // TODO: Implementar chamada para a API
        console.log('Excluindo avaliação:', avaliacaoId);
        await this.carregarAvaliacoes();
      } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
      }
    }
  }
}
