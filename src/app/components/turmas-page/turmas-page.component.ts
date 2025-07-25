import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados da turma
interface Turma {
  id: number;
  semestre: string;
  vagas: number;
  idDisciplina: number;
  idProfessor: number;
}

// Interface para os dados do aluno
interface Aluno {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
}

// Interface para os dados da matrícula do aluno na turma
interface MatriculaTurma {
  idMatricula: number;
  idTurma: number;
  situacao: number; // 2 = EM_ANDAMENTO, 1 = APROVADO, 0 = REPROVADO
}

// Interface para matrícula do aluno no sistema (conforme MatriculaDTO)
interface Matricula {
  id: number;
  numero: string;
  data: string;
  idAluno: number;
}

// Interface para os dados da disciplina
interface Disciplina {
  id: number;
  nome: string;
  descricao: string;
  cargaHoraria: number;
}

// Interface para os dados do professor
interface Professor {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  departamento: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

// Enum para os tipos de modal
enum ModalType {
  TURMA = 'turma',
  MATRICULA = 'matricula',
}

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turmas-page.component.html',
  styleUrl: './turmas-page.component.css',
})
export class TurmasPageComponent {
  turmas: Turma[] = [];
  alunos: Aluno[] = [];
  disciplinas: Disciplina[] = [];
  professores: Professor[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Propriedades do modal de turma
  showModal: boolean = false;
  selectedTurma: Turma | null = null;
  modalMode: ModalMode = ModalMode.VIEW;

  // Propriedades do modal de matrícula
  showMatriculaModal: boolean = false;
  turmaParaMatricula: Turma | null = null;
  alunosDisponiveis: Aluno[] = [];

  // Enums para usar no template
  ModalMode = ModalMode;
  ModalType = ModalType;

  // Propriedades de controle de permissão
  isAdmin: boolean = false;
  isProfessor: boolean = false;

  // Dados do formulário de turma
  formData: Turma = {
    id: 0,
    semestre: '',
    vagas: 0,
    idDisciplina: 0,
    idProfessor: 0,
  };

  // Dados do formulário de matrícula
  matriculaFormData: MatriculaTurma = {
    idMatricula: 0,
    idTurma: 0,
    situacao: 2, // EM_ANDAMENTO
  };

  // ID do aluno selecionado para matrícula
  alunoSelecionadoId: number = 0;

  // Estado do formulário
  isSubmitting: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    this.isAdmin = this.authService.isAdmin();
    this.isProfessor = this.authService.isProfessor();
  }

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    await this.carregar();
    await this.carregarDisciplinas();
    await this.carregarProfessores();
  }

  /**
   * Adiciona uma nova turma
   */
  async inserir() {
    this.abrirModalCriacao();
  }

  /**
   * Busca a lista de turmas na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/turmas');

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      let turmas = await response.json();
      console.log('Todas as turmas carregadas:', turmas);

      // Se for professor, filtrar apenas suas turmas
      if (this.isProfessor) {
        const userId = await this.authService.getCurrentUserId();
        console.log('ID do professor atual:', userId);
        console.log('É professor?', this.isProfessor);

        if (userId) {
          console.log('Filtrando turmas para professor ID:', userId);
          const turmasAntesDoFiltro = turmas.length;
          turmas = turmas.filter((turma: Turma) => {
            console.log(
              `Turma ${turma.id}: idProfessor = ${turma.idProfessor}, userId = ${userId}`
            );
            return turma.idProfessor === userId;
          });
          console.log(
            `Turmas após filtro: ${turmas.length} (antes: ${turmasAntesDoFiltro})`
          );
        } else {
          console.warn('Não foi possível obter o ID do professor');
        }
      }

      this.turmas = turmas;

      console.log('turmas carregadas (final):', this.turmas);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carrega a lista de disciplinas disponíveis
   */
  async carregarDisciplinas(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(
        '/disciplinas'
      );
      if (response.ok) {
        this.disciplinas = await response.json();
        console.log('Disciplinas carregadas:', this.disciplinas);
      } else {
        console.error('Erro ao carregar disciplinas:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  }

  /**
   * Carrega a lista de professores disponíveis
   */
  async carregarProfessores(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch(
        '/professores'
      );
      if (response.ok) {
        this.professores = await response.json();
        console.log('Professores carregados:', this.professores);
      } else {
        console.error('Erro ao carregar professores:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    }
  }

  /**
   * Recarrega a lista de turmas
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Obtém o nome da disciplina pelo ID
   */
  getNomeDisciplina(idDisciplina: number): string {
    const disciplina = this.disciplinas.find((d) => d.id === idDisciplina);
    return disciplina ? disciplina.nome : `Disciplina #${idDisciplina}`;
  }

  /**
   * Obtém o nome do professor pelo ID
   */
  getNomeProfessor(idProfessor: number): string {
    const professor = this.professores.find((p) => p.id === idProfessor);
    return professor ? professor.nome : `Professor #${idProfessor}`;
  }

  /**
   * Exclui uma turma
   */
  async excluir(turmaId: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) {
      return;
    }

    try {
      const response = await this.authService.authenticatedFetch(
        `/turmas/${turmaId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir turma');
      }

      // Remover da lista local
      this.turmas = this.turmas.filter((turma) => turma.id !== turmaId);
      console.log('Turma excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir turma:', error);
      this.errorMessage = 'Erro ao excluir turma';
    }
  }

  /**
   * Edita uma turma
   */
  editar(turmaId: number): void {
    const turma = this.turmas.find((p) => p.id === turmaId);
    if (turma) {
      this.abrirModalEdicao(turma);
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
   * Abre o modal com os detalhes do turma (modo visualização)
   */
  abrirModal(turma: Turma): void {
    this.selectedTurma = turma;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
  }

  /**
   * Abre o modal para criação de novo turma
   */
  abrirModalCriacao(): void {
    this.selectedTurma = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      semestre: '',
      vagas: 0,
      idDisciplina: 0,
      idProfessor: 0,
    };
    this.showModal = true;
  }

  /**
   * Abre o modal para edição de turma
   */
  abrirModalEdicao(turma: Turma): void {
    this.selectedTurma = turma;
    this.modalMode = ModalMode.EDIT;
    this.formData = { ...turma }; // Cópia dos dados para edição
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedTurma = null;
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
      if (this.modalMode === ModalMode.CREATE) {
        await this.create();
      } else if (this.modalMode === ModalMode.EDIT) {
        await this.atualizar();
      }

      this.fecharModal();
      await this.carregar(); // Recarrega a lista
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error);
      this.errorMessage = 'Erro ao salvar turma: ' + error.message;
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Cria uma nova turma
   */
  private async create(): Promise<void> {
    const response = await this.authService.authenticatedFetch('/turmas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        semestre: this.formData.semestre,
        vagas: this.formData.vagas,
        idDisciplina: this.formData.idDisciplina,
        idProfessor: this.formData.idProfessor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao criar turma');
    }
  }

  /**
   * Atualiza uma turma existente
   */
  private async atualizar(): Promise<void> {
    const response = await this.authService.authenticatedFetch(
      `/turmas/${this.formData.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          semestre: this.formData.semestre,
          vagas: this.formData.vagas,
          idDisciplina: this.formData.idDisciplina,
          idProfessor: this.formData.idProfessor,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao atualizar turma');
    }
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (!this.formData.semestre.trim()) {
      this.errorMessage = 'Semestre é obrigatório';
      return false;
    }
    if (this.formData.vagas <= 0) {
      this.errorMessage = 'Vagas são obrigatórias';
      return false;
    }
    if (this.formData.idDisciplina == 0) {
      this.errorMessage = 'Id da disciplina é obrigatório';
      return false;
    }
    if (this.formData.idProfessor == 0) {
      this.errorMessage = 'Id do professor é obrigatório';
      return false;
    }
    return true;
  }

  // ===== MÉTODOS DO MODAL DE MATRÍCULA =====

  /**
   * Abre o modal para matricular aluno na turma
   */
  async abrirModalMatricula(turma: Turma): Promise<void> {
    this.turmaParaMatricula = turma;
    this.matriculaFormData = {
      idMatricula: 0,
      idTurma: turma.id,
      situacao: 2, // EM_ANDAMENTO
    };

    // Carregar lista de alunos disponíveis
    await this.carregarAlunosDisponiveis(turma.id);
    this.showMatriculaModal = true;
  }

  /**
   * Fecha o modal de matrícula
   */
  fecharModalMatricula(): void {
    this.showMatriculaModal = false;
    this.turmaParaMatricula = null;
    this.alunosDisponiveis = [];
    this.alunoSelecionadoId = 0;
    this.matriculaFormData = {
      idMatricula: 0,
      idTurma: 0,
      situacao: 2, // EM_ANDAMENTO
    };
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  /**
   * Carrega a lista de alunos disponíveis (não matriculados na turma)
   */
  async carregarAlunosDisponiveis(turmaId: number): Promise<void> {
    try {
      // Carregar todos os alunos
      const alunosResponse = await this.authService.authenticatedFetch(
        '/alunos'
      );
      if (!alunosResponse.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      const todosAlunos = await alunosResponse.json();

      // Carregar todas as matrículas para mapear ID da matrícula para ID do aluno
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      if (!matriculasResponse.ok) {
        throw new Error('Erro ao carregar matrículas');
      }
      const matriculas = await matriculasResponse.json();

      // Filtrar apenas alunos que têm matrícula criada
      const alunosComMatricula = todosAlunos.filter((aluno: Aluno) =>
        matriculas.some((m: any) => m.idAluno === aluno.id)
      );

      console.log('Alunos com matrícula:', alunosComMatricula);

      // Carregar matrículas da turma (MatriculaTurma)
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

      // Obter IDs dos alunos já matriculados nesta turma
      const alunosMatriculadosIds = matriculasDestaTurma
        .map((mt: any) => {
          const matricula = matriculas.find(
            (m: any) => m.id === mt.idMatricula
          );
          return matricula ? matricula.idAluno : null;
        })
        .filter((id: any) => id !== null);

      // Filtrar alunos disponíveis (com matrícula e não matriculados nesta turma)
      this.alunosDisponiveis = alunosComMatricula.filter(
        (aluno: Aluno) => !alunosMatriculadosIds.includes(aluno.id)
      );

      console.log('Alunos disponíveis para matrícula:', this.alunosDisponiveis);
    } catch (error) {
      console.error('Erro ao carregar alunos disponíveis:', error);
      this.errorMessage = 'Erro ao carregar lista de alunos';
      this.alunosDisponiveis = [];
    }
  }

  /**
   * Salva a matrícula do aluno na turma
   */
  async salvarMatricula(): Promise<void> {
    if (!this.validarFormularioMatricula()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Primeiro, buscar a matrícula do aluno pelo ID
      const matriculasResponse = await this.authService.authenticatedFetch(
        '/matriculas'
      );
      if (!matriculasResponse.ok) {
        throw new Error('Erro ao buscar matrículas');
      }

      const matriculas = await matriculasResponse.json();
      console.log('Todas as matrículas encontradas:', matriculas);
      console.log(
        'ID do aluno selecionado:',
        this.alunoSelecionadoId,
        typeof this.alunoSelecionadoId
      );

      // Converter para number para garantir comparação correta
      const alunoId = Number(this.alunoSelecionadoId);
      console.log('ID do aluno convertido:', alunoId, typeof alunoId);

      const matriculaDoAluno = matriculas.find((m: any) => {
        console.log(
          `Comparando: m.idAluno (${
            m.idAluno
          }, ${typeof m.idAluno}) === alunoId (${alunoId}, ${typeof alunoId})`
        );
        return Number(m.idAluno) === alunoId;
      });
      console.log('Matrícula encontrada para o aluno:', matriculaDoAluno);

      if (!matriculaDoAluno) {
        console.log('Nenhuma matrícula encontrada para o aluno ID:', alunoId);
        console.log(
          'Matrículas disponíveis:',
          matriculas.map((m: any) => ({
            id: m.id,
            idAluno: m.idAluno,
            numero: m.numero,
            tipoIdAluno: typeof m.idAluno,
          }))
        );
        throw new Error(
          'Matrícula do aluno não encontrada. O aluno precisa ter uma matrícula criada antes de ser matriculado em uma turma.'
        );
      }

      // Preparar dados para criar MatriculaTurma
      const matriculaTurmaData = {
        idMatricula: matriculaDoAluno.id,
        idTurma: this.matriculaFormData.idTurma,
        situacao: 2, // EM_ANDAMENTO
      };

      console.log('Dados da matrícula na turma:', matriculaTurmaData);

      // Criar a MatriculaTurma
      const response = await this.authService.authenticatedFetch(
        '/matriculas-turmas',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(matriculaTurmaData),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          errorData || `Erro ${response.status}: ${response.statusText}`
        );
      }

      console.log('Aluno matriculado na turma com sucesso');

      // Fechar modal e recarregar dados
      this.fecharModalMatricula();
      await this.carregar();
    } catch (error: any) {
      console.error('Erro ao matricular aluno:', error);
      this.errorMessage = error.message || 'Erro ao matricular aluno na turma';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Valida o formulário de matrícula
   */
  validarFormularioMatricula(): boolean {
    if (!this.alunoSelecionadoId || this.alunoSelecionadoId === 0) {
      this.errorMessage = 'Selecione um aluno para matricular';
      return false;
    }

    if (
      !this.matriculaFormData.idTurma ||
      this.matriculaFormData.idTurma === 0
    ) {
      this.errorMessage = 'Turma não selecionada';
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
        return 'Detalhes da Turma';
      case ModalMode.EDIT:
        return 'Editar Turma';
      case ModalMode.CREATE:
        return 'Novo Turma';
      default:
        return 'Turma';
    }
  }
}
