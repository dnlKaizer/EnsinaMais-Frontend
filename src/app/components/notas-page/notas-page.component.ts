import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados da Nota
interface Nota {
  id: number;
  nota: number;
  idAvaliacao: number;
  idMatriculaTurma: number;
}

// Interface para Avaliação
interface Avaliacao {
  id: number;
  descricao: string;
  notaMaxima: number;
  data: string;
}

// Interface para Aluno (para o select)
interface AlunoMatriculado {
  idMatriculaTurma: number;
  idAluno: number;
  nomeAluno: string;
  cpfAluno: string;
  nomeTurma: string;
  semestreTurma: string;
  nomeDisciplina: string;
}

// Interface para dados completos de MatriculaTurma
interface MatriculaTurmaCompleta {
  idMatriculaTurma: number;
  idAluno: number;
  nomeAluno: string;
  cpfAluno: string;
  idTurma: number;
  semestreTurma: string;
  idDisciplina: number;
  nomeDisciplina: string;
  nomeTurma: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

@Component({
  selector: 'app-notas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas-page.component.html',
  styleUrl: './notas-page.component.css',
})
export class NotasPageComponent implements OnInit {
  notas: Nota[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  turmaIdFiltro: number | null = null; // Para filtrar por turma específica

  // Listas para os selects
  avaliacoesDaTurma: Avaliacao[] = [];
  alunosMatriculados: AlunoMatriculado[] = [];
  todasAvaliacoes: Avaliacao[] = [];
  todasMatriculasTurma: MatriculaTurmaCompleta[] = [];

  // Propriedades do modal
  showModal: boolean = false;
  selectedNota: Nota | null = null;
  modalMode: ModalMode = ModalMode.VIEW;

  // Enum para usar no template
  ModalMode = ModalMode;

  // Dados do formulário
  formData: Nota = {
    id: 0,
    nota: 0,
    idAvaliacao: 0,
    idMatriculaTurma: 0,
  };

  // Estado do formulário
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    this.verificarParametroTurma();
    await this.carregar();

    // Carregar dados para os selects apenas se houver filtro de turma
    if (this.turmaIdFiltro) {
      console.log('Carregando dados para turma:', this.turmaIdFiltro);
      await this.carregarAvaliacoesDaTurma();
      await this.carregarAlunosMatriculados();
    } else {
      console.log(
        'Nenhum filtro de turma aplicado - carregando todos os dados para admin'
      );
      await this.carregarTodasAvaliacoes();
      await this.carregarTodasMatriculasTurma();
    }
  }

  /**
   * Verifica se foi passado um ID de turma como parâmetro na query string
   */
  private verificarParametroTurma(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['turmaId']) {
        this.turmaIdFiltro = parseInt(params['turmaId'], 10);
        console.log('Filtro por turma aplicado nas notas:', this.turmaIdFiltro);
      }
    });
  }

  /**
   * Adiciona uma novo nota
   */
  async inserir() {
    await this.abrirModalCriacao();
  }

  /**
   * Busca a lista de notas na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/notas');

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      let notas = await response.json();

      // Se um filtro de turma foi aplicado, filtrar as notas através das avaliações
      if (this.turmaIdFiltro) {
        // Buscar avaliações para filtrar
        const avaliacoesResponse = await this.authService.authenticatedFetch(
          '/avaliacoes'
        );
        if (avaliacoesResponse.ok) {
          const avaliacoes = await avaliacoesResponse.json();

          // Obter IDs das avaliações da turma filtrada
          const avaliacoesDaTurma = avaliacoes
            .filter(
              (avaliacao: any) => avaliacao.idTurma === this.turmaIdFiltro
            )
            .map((avaliacao: any) => avaliacao.id);

          // Filtrar notas que pertencem às avaliações da turma
          notas = notas.filter((nota: Nota) =>
            avaliacoesDaTurma.includes(nota.idAvaliacao)
          );

          console.log(
            `Notas filtradas para turma ${this.turmaIdFiltro}:`,
            notas
          );
        }
      }

      this.notas = notas;

      console.log('Notas carregadas:', this.notas);
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carrega as avaliações da turma específica
   */
  async carregarAvaliacoesDaTurma(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch('/avaliacoes');
      if (response.ok) {
        const avaliacoes = await response.json();
        if (this.turmaIdFiltro) {
          this.avaliacoesDaTurma = avaliacoes.filter(
            (avaliacao: any) => avaliacao.idTurma === this.turmaIdFiltro
          );
        } else {
          // Se não houver filtro, usar todas as avaliações
          this.avaliacoesDaTurma = avaliacoes;
        }
        console.log('Avaliações carregadas:', this.avaliacoesDaTurma);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  }

  /**
   * Carrega os alunos matriculados na turma específica
   */
  async carregarAlunosMatriculados(): Promise<void> {
    try {
      console.log(
        'Carregando alunos matriculados para turma:',
        this.turmaIdFiltro
      );

      if (!this.turmaIdFiltro) {
        console.log('Nenhuma turma selecionada, não carregando alunos');
        this.alunosMatriculados = [];
        return;
      }

      // Buscar matrículas da turma (relação matrícula-turma)
      const matriculasTurmaResponse = await this.authService.authenticatedFetch(
        '/matriculas-turmas'
      );
      if (!matriculasTurmaResponse.ok) {
        throw new Error('Erro ao carregar matrículas da turma');
      }
      const matriculasTurma = await matriculasTurmaResponse.json();
      console.log('Todas as matriculas-turmas:', matriculasTurma);

      // Filtrar matrículas desta turma específica
      const matriculasDestaTurma = matriculasTurma.filter(
        (mt: any) => mt.idTurma === this.turmaIdFiltro
      );
      console.log('Matrículas da turma filtrada:', matriculasDestaTurma);

      if (matriculasDestaTurma.length === 0) {
        console.log('Nenhuma matrícula encontrada para esta turma');
        this.alunosMatriculados = [];
        return;
      }

      // Buscar todas as matrículas para mapear ID da matrícula para ID do aluno
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      if (!matriculasResponse.ok) {
        throw new Error('Erro ao carregar matrículas');
      }
      const matriculas = await matriculasResponse.json();
      console.log('Todas as matrículas:', matriculas);

      // Buscar todos os alunos
      const alunosResponse = await this.authService.authenticatedFetch(
        '/alunos'
      );
      if (!alunosResponse.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      const todosAlunos = await alunosResponse.json();
      console.log('Todos os alunos:', todosAlunos);

      // Mapear IDs das matrículas para IDs dos alunos
      const idsMatriculasDestaTurma = matriculasDestaTurma.map(
        (mt: any) => mt.idMatricula
      );
      console.log('IDs das matrículas desta turma:', idsMatriculasDestaTurma);

      const matriculasComAlunos = matriculas.filter((m: any) =>
        idsMatriculasDestaTurma.includes(m.id)
      );
      console.log('Matrículas com alunos desta turma:', matriculasComAlunos);

      // Criar lista de alunos matriculados com informações necessárias
      this.alunosMatriculados = matriculasComAlunos.map((matricula: any) => {
        const aluno = todosAlunos.find((a: any) => a.id === matricula.idAluno);
        const matriculaTurma = matriculasDestaTurma.find(
          (mt: any) => mt.idMatricula === matricula.id
        );

        console.log(
          `Matrícula ${matricula.id} - Aluno:`,
          aluno,
          'MatriculaTurma:',
          matriculaTurma
        );

        return {
          idMatriculaTurma: matriculaTurma ? matriculaTurma.id : 0,
          idAluno: matricula.idAluno,
          nomeAluno: aluno ? aluno.nome : 'Nome não encontrado',
          cpfAluno: aluno ? aluno.cpf : 'CPF não encontrado',
        };
      });

      console.log('Alunos matriculados carregados:', this.alunosMatriculados);
    } catch (error) {
      console.error('Erro ao carregar alunos matriculados:', error);
      this.alunosMatriculados = [];
    }
  }

  /**
   * Carrega todas as avaliações disponíveis (para admin)
   */
  async carregarTodasAvaliacoes(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch('/avaliacoes');
      if (response.ok) {
        this.todasAvaliacoes = await response.json();
        console.log('Todas as avaliações carregadas:', this.todasAvaliacoes);
      } else {
        console.error(
          'Erro ao carregar todas as avaliações:',
          response.statusText
        );
      }
    } catch (error) {
      console.error('Erro ao carregar todas as avaliações:', error);
    }
  }

  /**
   * Carrega todas as matrículas-turma com informações completas (para admin)
   */
  async carregarTodasMatriculasTurma(): Promise<void> {
    try {
      console.log('Carregando todas as matrículas-turma...');

      // Buscar todas as matrículas-turma
      const matriculasTurmaResponse = await this.authService.authenticatedFetch(
        '/matriculas-turmas'
      );
      if (!matriculasTurmaResponse.ok) {
        throw new Error('Erro ao carregar matrículas-turma');
      }
      const matriculasTurma = await matriculasTurmaResponse.json();
      console.log('Todas as matriculas-turmas:', matriculasTurma);

      // Buscar todas as matrículas
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      if (!matriculasResponse.ok) {
        throw new Error('Erro ao carregar matrículas');
      }
      const matriculas = await matriculasResponse.json();

      // Buscar todos os alunos
      const alunosResponse = await this.authService.authenticatedFetch(
        '/alunos'
      );
      if (!alunosResponse.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      const alunos = await alunosResponse.json();

      // Buscar todas as turmas
      const turmasResponse = await this.authService.authenticatedFetch(
        '/turmas'
      );
      if (!turmasResponse.ok) {
        throw new Error('Erro ao carregar turmas');
      }
      const turmas = await turmasResponse.json();

      // Buscar todas as disciplinas
      const disciplinasResponse = await this.authService.authenticatedFetch(
        '/disciplinas'
      );
      if (!disciplinasResponse.ok) {
        throw new Error('Erro ao carregar disciplinas');
      }
      const disciplinas = await disciplinasResponse.json();

      // Construir lista completa
      this.todasMatriculasTurma = matriculasTurma.map((mt: any) => {
        const matricula = matriculas.find((m: any) => m.id === mt.idMatricula);
        const aluno = alunos.find((a: any) => a.id === matricula?.idAluno);
        const turma = turmas.find((t: any) => t.id === mt.idTurma);
        const disciplina = disciplinas.find(
          (d: any) => d.id === turma?.idDisciplina
        );

        return {
          idMatriculaTurma: mt.id,
          idAluno: matricula?.idAluno || 0,
          nomeAluno: aluno?.nome || 'Nome não encontrado',
          cpfAluno: aluno?.cpf || 'CPF não encontrado',
          idTurma: mt.idTurma,
          semestreTurma: turma?.semestre || 'Semestre não encontrado',
          idDisciplina: turma?.idDisciplina || 0,
          nomeDisciplina: disciplina?.nome || 'Disciplina não encontrada',
          nomeTurma: `${disciplina?.nome || 'Disciplina'} - ${
            turma?.semestre || 'Semestre'
          }`,
        };
      });

      console.log(
        'Todas as matrículas-turma carregadas:',
        this.todasMatriculasTurma
      );
    } catch (error) {
      console.error('Erro ao carregar todas as matrículas-turma:', error);
      this.todasMatriculasTurma = [];
    }
  }

  /**
   * Recarrega a lista de notas
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Obtém o nome da avaliação pelo ID
   */
  getAvaliacaoNome(idAvaliacao: number): string {
    // Para admin (sem filtro de turma), usar todas as avaliações
    const listaAvaliacoes = this.turmaIdFiltro
      ? this.avaliacoesDaTurma
      : this.todasAvaliacoes;
    const avaliacao = listaAvaliacoes.find((a) => a.id === idAvaliacao);
    return avaliacao ? avaliacao.descricao : `Avaliação #${idAvaliacao}`;
  }

  /**
   * Obtém o nome do aluno pelo ID da matrícula-turma
   */
  getAlunoNome(idMatriculaTurma: number): string {
    if (this.turmaIdFiltro) {
      // Para professor (com filtro de turma)
      const aluno = this.alunosMatriculados.find(
        (a) => a.idMatriculaTurma === idMatriculaTurma
      );
      return aluno ? aluno.nomeAluno : `Matrícula #${idMatriculaTurma}`;
    } else {
      // Para admin (sem filtro de turma)
      const matricula = this.todasMatriculasTurma.find(
        (mt) => mt.idMatriculaTurma === idMatriculaTurma
      );
      return matricula
        ? `${matricula.nomeAluno} (${matricula.nomeTurma})`
        : `Matrícula #${idMatriculaTurma}`;
    }
  }

  /**
   * Exclui uma nota
   */
  async excluir(notaId: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) {
      return;
    }

    try {
      const response = await this.authService.authenticatedFetch(
        `/notas/${notaId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir nota');
      }

      // Remover da lista local
      this.notas = this.notas.filter((nota) => nota.id !== notaId);
      console.log('Nota excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error);
      this.errorMessage = 'Erro ao excluir nota';
    }
  }

  /**
   * Edita uma nota
   */
  async editar(notaId: number): Promise<void> {
    const nota = this.notas.find((n) => n.id === notaId);
    if (nota) {
      await this.abrirModalEdicao(nota);
    }
  }

  /**
   * Executa o logout do usuário e redireciona para a página de login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  home(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Abre o modal com os detalhes da nota (modo visualização)
   */
  abrirModal(nota: Nota): void {
    this.selectedNota = nota;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
  }

  /**
   * Abre o modal para criação de nova nota
   */
  async abrirModalCriacao(): Promise<void> {
    this.selectedNota = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      nota: 0,
      idAvaliacao: 0,
      idMatriculaTurma: 0,
    };

    // Carregar dados para os selects se ainda não foram carregados
    if (this.turmaIdFiltro) {
      // Modo professor (com filtro de turma)
      if (this.avaliacoesDaTurma.length === 0) {
        await this.carregarAvaliacoesDaTurma();
      }
      if (this.alunosMatriculados.length === 0) {
        await this.carregarAlunosMatriculados();
      }
    } else {
      // Modo admin (sem filtro de turma)
      if (this.todasAvaliacoes.length === 0) {
        await this.carregarTodasAvaliacoes();
      }
      if (this.todasMatriculasTurma.length === 0) {
        await this.carregarTodasMatriculasTurma();
      }
    }

    this.showModal = true;
  }

  /**
   * Abre o modal para edição de nota
   */
  async abrirModalEdicao(nota: Nota): Promise<void> {
    this.selectedNota = nota;
    this.modalMode = ModalMode.EDIT;
    this.formData = { ...nota }; // Cópia dos dados para edição

    // Carregar dados para os selects se ainda não foram carregados
    if (this.turmaIdFiltro) {
      // Modo professor (com filtro de turma)
      if (this.avaliacoesDaTurma.length === 0) {
        await this.carregarAvaliacoesDaTurma();
      }
      if (this.alunosMatriculados.length === 0) {
        await this.carregarAlunosMatriculados();
      }
    } else {
      // Modo admin (sem filtro de turma)
      if (this.todasAvaliacoes.length === 0) {
        await this.carregarTodasAvaliacoes();
      }
      if (this.todasMatriculasTurma.length === 0) {
        await this.carregarTodasMatriculasTurma();
      }
    }

    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedNota = null;
    this.modalMode = ModalMode.VIEW;
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  /**
   * Salva os dados do formulário (criar ou editar)
   */
  async salvar(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Log dados do formulário para debug
      console.log('Dados do formulário antes de salvar:', this.formData);
      console.log('Modo do modal:', this.modalMode);

      if (this.modalMode === ModalMode.CREATE) {
        await this.create();
      } else if (this.modalMode === ModalMode.EDIT) {
        await this.atualizar();
      }

      this.fecharModal();
      await this.carregar(); // Recarrega a lista
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      this.errorMessage = error.message || 'Erro ao salvar nota';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Cria uma nova nota
   */
  private async create(): Promise<void> {
    // Verificar se é professor e obter ID
    console.log('Verificando usuário logado...');
    console.log('É professor:', this.authService.isProfessor());
    console.log('É admin:', this.authService.isAdmin());

    // Debug do token
    const token = localStorage.getItem('token');
    console.log('Token completo:', token);
    console.log('Usuário logado:', this.authService.getUsername());

    const dados = {
      nota: Number(this.formData.nota), // Converter para número
      idAvaliacao: Number(this.formData.idAvaliacao), // Converter para Long
      idMatriculaTurma: Number(this.formData.idMatriculaTurma), // Converter para Long
    };

    console.log('Dados sendo enviados para criar nota:', dados);
    console.log('Tipos dos dados:', {
      nota: typeof dados.nota,
      idAvaliacao: typeof dados.idAvaliacao,
      idMatriculaTurma: typeof dados.idMatriculaTurma,
    });

    // Verificar se todos os valores são válidos
    if (dados.nota <= 0 || isNaN(dados.nota)) {
      throw new Error('Nota deve ser um número válido maior que 0');
    }
    if (dados.idAvaliacao <= 0 || isNaN(dados.idAvaliacao)) {
      throw new Error('ID da avaliação deve ser um número válido');
    }
    if (dados.idMatriculaTurma <= 0 || isNaN(dados.idMatriculaTurma)) {
      throw new Error('ID da matrícula-turma deve ser um número válido');
    }

    // Verificar se já existe uma nota para esta combinação
    const notaExistente = this.notas.find(
      (nota) =>
        nota.idAvaliacao === dados.idAvaliacao &&
        nota.idMatriculaTurma === dados.idMatriculaTurma
    );

    if (notaExistente) {
      throw new Error(
        `Já existe uma nota para este aluno nesta avaliação (ID: ${notaExistente.id}). Para alterar a nota, use a opção de editar.`
      );
    }

    const response = await this.authService.authenticatedFetch('/notas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    console.log(
      'Resposta da criação de nota:',
      response.status,
      response.statusText
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        console.log('Erro detalhado:', errorData);
      } catch (e) {
        errorData = 'Erro desconhecido';
      }

      // Tratamento específico para diferentes tipos de erro
      if (response.status === 403) {
        throw new Error(
          'Acesso negado para criar notas. Verifique suas permissões.'
        );
      } else if (response.status === 409) {
        // Conflict - já existe uma nota
        throw new Error(
          errorData ||
            'Já existe uma nota para este aluno nesta avaliação. Para alterar a nota, use a opção de editar.'
        );
      } else if (
        errorData &&
        (errorData.includes('constraint') || errorData.includes('unique'))
      ) {
        throw new Error(
          'Já existe uma nota para este aluno nesta avaliação. Para alterar a nota, use a opção de editar.'
        );
      } else if (response.status >= 500) {
        throw new Error(
          'Erro interno do servidor. Tente novamente em alguns instantes.'
        );
      }

      throw new Error(errorData || 'Erro ao criar nota');
    }

    console.log('Nota criada com sucesso');
  }

  /**
   * Atualiza uma nota existente
   */
  private async atualizar(): Promise<void> {
    const dados = {
      nota: Number(this.formData.nota), // Converter para número
      idAvaliacao: Number(this.formData.idAvaliacao), // Converter para Long
      idMatriculaTurma: Number(this.formData.idMatriculaTurma), // Converter para Long
    };

    console.log('Dados sendo enviados para atualizar nota:', dados);

    const response = await this.authService.authenticatedFetch(
      `/notas/${this.formData.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
        console.log('Erro detalhado na atualização:', errorData);
      } catch (e) {
        errorData = 'Erro desconhecido';
      }
      throw new Error(errorData || 'Erro ao atualizar nota');
    }

    console.log('Nota atualizada com sucesso');
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (this.formData.nota <= 0) {
      this.errorMessage = 'Nota é obrigatória';
      return false;
    }
    if (this.formData.idAvaliacao <= 0) {
      this.errorMessage = 'Id da avaliação é obrigatório';
      return false;
    }
    if (this.formData.idMatriculaTurma <= 0) {
      this.errorMessage = 'Id de MatriculaTurma é obrigatório';
      return false;
    }
    return true;
  }

  /**
   * Retorna o título do modal baseado no modo
   */
  getModalTitle(): string {
    switch (this.modalMode) {
      case ModalMode.VIEW:
        return 'Detalhes da Nota';
      case ModalMode.EDIT:
        return 'Editar Nota';
      case ModalMode.CREATE:
        return 'Novo Nota';
      default:
        return 'Nota';
    }
  }
}
