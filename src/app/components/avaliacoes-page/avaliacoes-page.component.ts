import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados da avaliação
interface Avaliacao {
  id: number;
  data: string;
  descricao: string;
  notaMaxima: number;
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

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

@Component({
  selector: 'app-avaliacoes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avaliacoes-page.component.html',
  styleUrl: './avaliacoes-page.component.css',
})
export class AvaliacoesPageComponent implements OnInit {
  avaliacoes: Avaliacao[] = [];
  turmas: Turma[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  turmaIdFiltro: number | null = null; // Para filtrar por turma específica
  turmaFixa: boolean = false; // Para indicar se a turma está fixa (não pode ser alterada)

  // Propriedades do modal
  showModal: boolean = false;
  selectedAvaliacao: Avaliacao | null = null;
  modalMode: ModalMode = ModalMode.VIEW;

  // Enum para usar no template
  ModalMode = ModalMode;

  // Dados do formulário
  formData: Avaliacao = {
    id: 0,
    data: '',
    descricao: '',
    notaMaxima: 0,
    idTurma: 0,
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
    await this.carregarTurmas();
  }

  /**
   * Verifica se foi passado um ID de turma como parâmetro na query string
   */
  private verificarParametroTurma(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['turmaId']) {
        this.turmaIdFiltro = parseInt(params['turmaId'], 10);
        this.formData.idTurma = this.turmaIdFiltro; // Pre-selecionar a turma no formulário
        this.turmaFixa = true; // Turma fixa, não pode ser alterada
        console.log(
          'Filtro por turma aplicado nas avaliações:',
          this.turmaIdFiltro
        );
      }
    });
  }

  /**
   * Adiciona uma nova avaliação
   */
  async inserir() {
    this.abrirModalCriacao();
  }

  /**
   * Busca a lista de avaliações na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/avaliacoes');

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      let avaliacoes = await response.json();

      // Se um filtro de turma foi aplicado, filtrar as avaliações
      if (this.turmaIdFiltro) {
        avaliacoes = avaliacoes.filter(
          (avaliacao: Avaliacao) => avaliacao.idTurma === this.turmaIdFiltro
        );
        console.log(
          `Avaliações filtradas para turma ${this.turmaIdFiltro}:`,
          avaliacoes
        );
      }

      this.avaliacoes = avaliacoes;

      console.log('Avaliações carregadas:', this.avaliacoes);
    } catch (error: any) {
      console.error('Erro ao carregar avaliações:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Busca a lista de turmas na API
   */
  async carregarTurmas(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch('/turmas');

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      this.turmas = await response.json();
      console.log('Turmas carregadas:', this.turmas);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', error);
      // Não mostra erro de turmas para não interferir na UX principal
    }
  }

  /**
   * Recarrega a lista de avaliações
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Abre o modal para visualizar detalhes da avaliação
   */
  abrirModal(avaliacao: Avaliacao): void {
    this.selectedAvaliacao = avaliacao;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Abre o modal para criar uma nova avaliação
   */
  abrirModalCriacao(): void {
    this.selectedAvaliacao = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      data: '',
      descricao: '',
      notaMaxima: 0,
      idTurma: this.turmaIdFiltro || 0, // Manter a turma pré-selecionada se existir
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Abre o modal para editar uma avaliação existente
   */
  abrirModalEdicao(avaliacao: Avaliacao): void {
    this.selectedAvaliacao = avaliacao;
    this.modalMode = ModalMode.EDIT;
    this.formData = { ...avaliacao };
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedAvaliacao = null;
    this.modalMode = ModalMode.VIEW;
    this.errorMessage = '';
    this.isSubmitting = false;
  }

  /**
   * Retorna o título do modal baseado no modo atual
   */
  getModalTitle(): string {
    switch (this.modalMode) {
      case ModalMode.VIEW:
        return 'Detalhes da Avaliação';
      case ModalMode.EDIT:
        return 'Editar Avaliação';
      case ModalMode.CREATE:
        return 'Adicionar Nova Avaliação';
      default:
        return 'Avaliação';
    }
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
      let response: Response;

      if (this.modalMode === ModalMode.CREATE) {
        // Criar nova avaliação
        response = await this.authService.authenticatedFetch('/avaliacoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: this.formData.data,
            descricao: this.formData.descricao,
            notaMaxima: Number(this.formData.notaMaxima),
            idTurma: Number(this.formData.idTurma),
          }),
        });
      } else {
        // Editar avaliação existente
        response = await this.authService.authenticatedFetch(
          `/avaliacoes/${this.formData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: this.formData.data,
              descricao: this.formData.descricao,
              notaMaxima: Number(this.formData.notaMaxima),
              idTurma: Number(this.formData.idTurma),
            }),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          errorData || `Erro ${response.status}: ${response.statusText}`
        );
      }

      // Recarregar a lista de avaliações
      await this.carregar();

      // Fechar o modal
      this.fecharModal();
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      this.errorMessage = error.message || 'Erro ao salvar dados';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (!this.formData.descricao || this.formData.descricao.trim() === '') {
      this.errorMessage = 'A descrição é obrigatória';
      return false;
    }

    if (!this.formData.data || this.formData.data.trim() === '') {
      this.errorMessage = 'A data é obrigatória';
      return false;
    }

    if (!this.formData.notaMaxima || this.formData.notaMaxima <= 0) {
      this.errorMessage = 'A nota máxima deve ser maior que 0';
      return false;
    }

    if (!this.formData.idTurma || Number(this.formData.idTurma) <= 0) {
      this.errorMessage = 'A turma é obrigatória';
      return false;
    }

    return true;
  }

  /**
   * Edita uma avaliação específica
   */
  editar(id: number): void {
    const avaliacao = this.avaliacoes.find((a) => a.id === id);
    if (avaliacao) {
      this.abrirModalEdicao(avaliacao);
    }
  }

  /**
   * Exclui uma avaliação
   */
  async excluir(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
      return;
    }

    this.errorMessage = '';

    try {
      const response = await this.authService.authenticatedFetch(
        `/avaliacoes/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          errorData || `Erro ${response.status}: ${response.statusText}`
        );
      }

      // Recarregar a lista de avaliações
      await this.carregar();

      // Fechar o modal se estiver aberto
      if (this.showModal && this.selectedAvaliacao?.id === id) {
        this.fecharModal();
      }
    } catch (error: any) {
      console.error('Erro ao excluir avaliação:', error);
      this.errorMessage = error.message || 'Erro ao excluir avaliação';
    }
  }

  /**
   * Formata a data para exibição
   */
  formatarData(data: string): string {
    if (!data) return '';

    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return data;
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
   * Navega para a home
   */
  home(): void {
    this.router.navigate(['/home']);
  }
}
