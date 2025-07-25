import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados do aluno
interface Aluno {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  dataNascimento: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
}

@Component({
  selector: 'app-alunos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alunos-page.component.html',
  styleUrl: './alunos-page.component.css',
})
export class AlunosPageComponent {
  alunos: Aluno[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Verificação de tipo de usuário
  isAdmin: boolean = false;
  isProfessor: boolean = false;

  // Propriedades do modal
  showModal: boolean = false;
  selectedAluno: Aluno | null = null;
  modalMode: ModalMode = ModalMode.VIEW;

  // Enum para usar no template
  ModalMode = ModalMode;

  // Dados do formulário
  formData: Aluno = {
    id: 0,
    nome: '',
    cpf: '',
    email: '',
    dataNascimento: '',
  };

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
  }

  /**
   * Adiciona um novo aluno
   */
  async inserir() {
    this.abrirModalCriacao();
  }

  /**
   * Busca a lista de alunos na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/alunos');

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      this.alunos = await response.json();

      console.log('Alunos carregados:', this.alunos);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Recarrega a lista de alunos
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Abre o modal para visualizar detalhes do aluno
   */
  abrirModal(aluno: Aluno): void {
    this.selectedAluno = aluno;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Abre o modal para criar um novo aluno
   */
  abrirModalCriacao(): void {
    this.selectedAluno = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      nome: '',
      cpf: '',
      email: '',
      dataNascimento: '',
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Abre o modal para editar um aluno existente
   */
  abrirModalEdicao(aluno: Aluno): void {
    this.selectedAluno = aluno;
    this.modalMode = ModalMode.EDIT;
    this.formData = { ...aluno };
    this.showModal = true;
    this.errorMessage = '';
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedAluno = null;
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
        return 'Detalhes do Aluno';
      case ModalMode.EDIT:
        return 'Editar Aluno';
      case ModalMode.CREATE:
        return 'Adicionar Novo Aluno';
      default:
        return 'Aluno';
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
        // Criar novo aluno
        response = await this.authService.authenticatedFetch('/alunos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: this.formData.nome,
            cpf: this.formData.cpf,
            email: this.formData.email,
            dataNascimento: this.formData.dataNascimento,
          }),
        });
      } else {
        // Editar aluno existente
        response = await this.authService.authenticatedFetch(
          `/alunos/${this.formData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome: this.formData.nome,
              cpf: this.formData.cpf,
              email: this.formData.email,
              dataNascimento: this.formData.dataNascimento,
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

      // Recarregar a lista de alunos
      await this.carregar();

      // Fechar o modal
      this.fecharModal();
    } catch (error: any) {
      console.error('Erro ao salvar aluno:', error);
      this.errorMessage = error.message || 'Erro ao salvar dados';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (!this.formData.nome || this.formData.nome.trim() === '') {
      this.errorMessage = 'O nome é obrigatório';
      return false;
    }

    if (!this.formData.cpf || this.formData.cpf.trim() === '') {
      this.errorMessage = 'O CPF é obrigatório';
      return false;
    }

    if (!this.formData.email || this.formData.email.trim() === '') {
      this.errorMessage = 'O email é obrigatório';
      return false;
    }

    if (
      !this.formData.dataNascimento ||
      this.formData.dataNascimento.trim() === ''
    ) {
      this.errorMessage = 'A data de nascimento é obrigatória';
      return false;
    }

    return true;
  }

  /**
   * Edita um aluno específico
   */
  editar(id: number): void {
    const aluno = this.alunos.find((a) => a.id === id);
    if (aluno) {
      this.abrirModalEdicao(aluno);
    }
  }

  /**
   * Exclui um aluno
   */
  async excluir(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) {
      return;
    }

    this.errorMessage = '';

    try {
      const response = await this.authService.authenticatedFetch(
        `/alunos/${id}`,
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

      // Recarregar a lista de alunos
      await this.carregar();

      // Fechar o modal se estiver aberto
      if (this.showModal && this.selectedAluno?.id === id) {
        this.fecharModal();
      }
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error);
      this.errorMessage = error.message || 'Erro ao excluir aluno';
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
