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

interface Aluno {
  id: number;
  nome: string;
  matricula: string;
}

interface Avaliacao {
  id: number;
  nome: string;
  valorTotal: number;
  tipo: string;
}

interface Nota {
  id?: number;
  alunoId: number;
  avaliacaoId: number;
  valor: number;
}

interface AlunoNota {
  aluno: Aluno;
  notas: Nota[];
  media: number;
  situacao: 'Aprovado' | 'Recuperação' | 'Reprovado' | 'Cursando';
}

@Component({
  selector: 'app-minhas-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minhas-notas.component.html',
  styleUrl: './minhas-notas.component.css',
})
export class MinhasNotasComponent implements OnInit {
  minhasTurmas: Turma[] = [];
  turmaIdSelecionada: string = '';
  turmaSelecionada: Turma | null = null;
  notasAlunos: AlunoNota[] = [];
  avaliacoesTurma: Avaliacao[] = [];
  notasTemp: Map<string, number> = new Map(); // Para armazenar notas temporárias
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.carregarMinhasTurmas();
    this.verificarParametroTurma();
  }

  /**
   * Verifica se foi passado um ID de turma como parâmetro na rota
   */
  private verificarParametroTurma(): void {
    const turmaId = this.route.snapshot.paramMap.get('turmaId');
    if (turmaId) {
      this.turmaIdSelecionada = turmaId;
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
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }

  /**
   * Handler para mudança de turma
   */
  async onTurmaChange(): Promise<void> {
    if (this.turmaIdSelecionada) {
      this.turmaSelecionada =
        this.minhasTurmas.find(
          (t) => t.id === parseInt(this.turmaIdSelecionada)
        ) || null;
      await this.carregarDadosTurma();
    } else {
      this.turmaSelecionada = null;
      this.notasAlunos = [];
      this.avaliacoesTurma = [];
    }
  }

  /**
   * Carrega os dados da turma (alunos, avaliações e notas)
   */
  async carregarDadosTurma(): Promise<void> {
    this.isLoading = true;
    try {
      // TODO: Implementar chamadas para a API

      // Carregar avaliações da turma
      this.avaliacoesTurma = [
        { id: 1, nome: 'Prova 1', valorTotal: 10, tipo: 'Prova' },
        { id: 2, nome: 'Trabalho 1', valorTotal: 8, tipo: 'Trabalho' },
        { id: 3, nome: 'Prova 2', valorTotal: 10, tipo: 'Prova' },
      ];

      // Carregar alunos e suas notas
      const alunos = [
        { id: 1, nome: 'João Silva', matricula: '2024001' },
        { id: 2, nome: 'Maria Santos', matricula: '2024002' },
        { id: 3, nome: 'Pedro Oliveira', matricula: '2024003' },
      ];

      // Notas existentes (mockadas)
      const notasExistentes: Nota[] = [
        { id: 1, alunoId: 1, avaliacaoId: 1, valor: 8.5 },
        { id: 2, alunoId: 1, avaliacaoId: 2, valor: 7.0 },
        { id: 3, alunoId: 2, avaliacaoId: 1, valor: 9.0 },
        { id: 4, alunoId: 3, avaliacaoId: 1, valor: 6.5 },
      ];

      // Processar dados para exibição
      this.notasAlunos = alunos.map((aluno) => {
        const notasAluno = notasExistentes.filter(
          (n) => n.alunoId === aluno.id
        );
        const media = this.calcularMedia(notasAluno);
        const situacao = this.determinarSituacao(media);

        return {
          aluno,
          notas: notasAluno,
          media,
          situacao,
        };
      });
    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Retorna a nota do aluno para uma avaliação específica
   */
  getNota(alunoId: number, avaliacaoId: number): number | null {
    const chave = `${alunoId}-${avaliacaoId}`;

    // Verifica se há uma nota temporária
    if (this.notasTemp.has(chave)) {
      return this.notasTemp.get(chave)!;
    }

    // Busca a nota existente
    const alunoNota = this.notasAlunos.find((an) => an.aluno.id === alunoId);
    const nota = alunoNota?.notas.find((n) => n.avaliacaoId === avaliacaoId);
    return nota ? nota.valor : null;
  }

  /**
   * Salva uma nota temporariamente
   */
  salvarNota(alunoId: number, avaliacaoId: number, event: any): void {
    const valor = parseFloat(event.target.value);
    const chave = `${alunoId}-${avaliacaoId}`;

    if (!isNaN(valor)) {
      this.notasTemp.set(chave, valor);
      this.atualizarMediaAluno(alunoId);
    }
  }

  /**
   * Atualiza a média de um aluno
   */
  private atualizarMediaAluno(alunoId: number): void {
    const alunoNota = this.notasAlunos.find((an) => an.aluno.id === alunoId);
    if (!alunoNota) return;

    // Coleta todas as notas (existentes + temporárias)
    const todasNotas: number[] = [];

    for (const avaliacao of this.avaliacoesTurma) {
      const chave = `${alunoId}-${avaliacao.id}`;
      let nota: number | null = null;

      if (this.notasTemp.has(chave)) {
        nota = this.notasTemp.get(chave)!;
      } else {
        const notaExistente = alunoNota.notas.find(
          (n) => n.avaliacaoId === avaliacao.id
        );
        nota = notaExistente ? notaExistente.valor : null;
      }

      if (nota !== null) {
        // Converte para escala 0-10
        const notaNormalizada = (nota / avaliacao.valorTotal) * 10;
        todasNotas.push(notaNormalizada);
      }
    }

    // Calcula nova média
    const media =
      todasNotas.length > 0
        ? todasNotas.reduce((sum, nota) => sum + nota, 0) / todasNotas.length
        : 0;

    alunoNota.media = media;
    alunoNota.situacao = this.determinarSituacao(media);
  }

  /**
   * Calcula a média das notas
   */
  private calcularMedia(notas: Nota[]): number {
    if (notas.length === 0) return 0;

    // Normaliza as notas para escala 0-10 baseado no valor total da avaliação
    const notasNormalizadas = notas.map((nota) => {
      const avaliacao = this.avaliacoesTurma.find(
        (a) => a.id === nota.avaliacaoId
      );
      return avaliacao ? (nota.valor / avaliacao.valorTotal) * 10 : 0;
    });

    return (
      notasNormalizadas.reduce((sum, nota) => sum + nota, 0) /
      notasNormalizadas.length
    );
  }

  /**
   * Determina a situação do aluno baseado na média
   */
  private determinarSituacao(
    media: number
  ): 'Aprovado' | 'Recuperação' | 'Reprovado' | 'Cursando' {
    if (media >= 7) return 'Aprovado';
    if (media >= 5) return 'Recuperação';
    if (media > 0) return 'Reprovado';
    return 'Cursando';
  }

  /**
   * Retorna a classe CSS baseada na média
   */
  getClasseMedia(media: number): string {
    if (media >= 7) return 'media-alta';
    if (media >= 5) return 'media-media';
    return 'media-baixa';
  }

  /**
   * Retorna a classe CSS baseada na situação
   */
  getClasseSituacao(situacao: string): string {
    switch (situacao) {
      case 'Aprovado':
        return 'bg-aprovado text-white';
      case 'Recuperação':
        return 'bg-recuperacao text-white';
      case 'Reprovado':
        return 'bg-reprovado text-white';
      case 'Cursando':
        return 'bg-cursando text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  /**
   * Salva todas as notas temporárias
   */
  async salvarTodasNotas(): Promise<void> {
    try {
      // TODO: Implementar chamada para a API
      console.log('Salvando notas:', this.notasTemp);

      // Simula salvamento
      this.notasTemp.clear();
      alert('Notas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas. Tente novamente.');
    }
  }

  /**
   * Exporta as notas para planilha
   */
  exportarNotas(): void {
    // TODO: Implementar exportação para Excel/CSV
    console.log('Exportando notas da turma:', this.turmaIdSelecionada);
    alert('Funcionalidade de exportação será implementada em breve.');
  }
}
