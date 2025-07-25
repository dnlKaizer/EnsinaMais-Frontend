import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados do professor
interface Professor {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  titulacao: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

@Component({
  selector: 'app-professores-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professores-page.component.html',
  styleUrl: './professores-page.component.css'
})
export class ProfessoresPageComponent {

  professores: Professor[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Propriedades do modal
  showModal: boolean = false;
  selectedProfessor: Professor | null = null;
  modalMode: ModalMode = ModalMode.VIEW;
  
  // Enum para usar no template
  ModalMode = ModalMode;
  
  // Dados do formulário
  formData: Professor = {
    id: 0,
    nome: '',
    cpf: '',
    email: '',
    titulacao: ''
  };
  
  // Estado do formulário
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    await this.carregar();
  }

  /**
   * Adiciona um novo professor
   */ 
  async inserir() {
    this.abrirModalCriacao();
  }

  /**
   * Busca a lista de professores na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/professores');
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      this.professores = await response.json();

      console.log('Professores carregados:', this.professores);

    } catch (error: any) {
      console.error('Erro ao carregar professores:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Recarrega a lista de professores
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Exclui um professor
   */
  async excluir(professorId: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este professor?')) {
      return;
    }

    try {
      const response = await this.authService.authenticatedFetch(`/professores/${professorId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir professor');
      }

      // Remover da lista local
      this.professores = this.professores.filter(prof => prof.id !== professorId);
      console.log('Professor excluído com sucesso');

    } catch (error: any) {
      console.error('Erro ao excluir professor:', error);
      this.errorMessage = 'Erro ao excluir professor';
    }
  }

  /**
   * Edita um professor
   */
  editar(professorId: number): void {
    const professor = this.professores.find(p => p.id === professorId);
    if (professor) {
      this.abrirModalEdicao(professor);
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
   * Abre o modal com os detalhes do professor (modo visualização)
   */
  abrirModal(professor: Professor): void {
    this.selectedProfessor = professor;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
  }

  /**
   * Abre o modal para criação de novo professor
   */
  abrirModalCriacao(): void {
    this.selectedProfessor = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      nome: '',
      cpf: '',
      email: '',
      titulacao: ''
    };
    this.showModal = true;
  }

  /**
   * Abre o modal para edição de professor
   */
  abrirModalEdicao(professor: Professor): void {
    this.selectedProfessor = professor;
    this.modalMode = ModalMode.EDIT;
    this.formData = { ...professor }; // Cópia dos dados para edição
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedProfessor = null;
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
      console.error('Erro ao salvar professor:', error);
      this.errorMessage = error.message || 'Erro ao salvar professor';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Cria um novo professor
   */
  private async create(): Promise<void> {
    const response = await this.authService.authenticatedFetch('/professores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: this.formData.nome,
        cpf: this.formData.cpf,
        email: this.formData.email,
        titulacao: this.formData.titulacao
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao criar professor');
    }
  }

  /**
   * Atualiza um professor existente
   */
  private async atualizar(): Promise<void> {
    const response = await this.authService.authenticatedFetch(`/professores/${this.formData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: this.formData.nome,
        cpf: this.formData.cpf,
        email: this.formData.email,
        titulacao: this.formData.titulacao
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao atualizar professor');
    }
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (!this.formData.nome.trim()) {
      this.errorMessage = 'Nome é obrigatório';
      return false;
    }
    if (!this.formData.cpf.trim()) {
      this.errorMessage = 'CPF é obrigatório';
      return false;
    }
    if (!this.formData.titulacao.trim()) {
      this.errorMessage = 'Titulação é obrigatória';
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
        return 'Detalhes do Professor';
      case ModalMode.EDIT:
        return 'Editar Professor';
      case ModalMode.CREATE:
        return 'Novo Professor';
      default:
        return 'Professor';
    }
  }
}
