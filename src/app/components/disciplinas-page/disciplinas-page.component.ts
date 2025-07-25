import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados da Disciplia
interface Disciplina {
  id: number;
  nome: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create'
}

@Component({
  selector: 'app-disciplinas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disciplinas-page.component.html',
  styleUrl: './disciplinas-page.component.css'
})
export class DisciplinasPageComponent {
  
    disciplinas: Disciplina[] = [];
    isLoading: boolean = false;
    errorMessage: string = '';
  
    // Propriedades do modal
    showModal: boolean = false;
    selectedDisciplina: Disciplina | null = null;
    modalMode: ModalMode = ModalMode.VIEW;
    
    // Enum para usar no template
    ModalMode = ModalMode;
    
    // Dados do formulário
    formData: Disciplina = {
      id: 0,
      nome: ''
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
     * Adiciona uma nova disciplina
     */ 
    async inserir() {
      this.abrirModalCriacao();
    }
  
    /**
     * Busca a lista de disciplinas na API
     */
    async carregar(): Promise<void> {
      this.isLoading = true;
      this.errorMessage = '';
  
      try {
        // Fazer requisição GET autenticada
        const response = await this.authService.authenticatedFetch('/disciplinas');
        
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
  
        // Converter resposta para JSON
        this.disciplinas = await response.json();
  
        console.log('Disciplinas carregadas:', this.disciplinas);
  
      } catch (error: any) {
        console.error('Erro ao carregar disciplinas:', error);
        this.errorMessage = error.message || 'Erro ao carregar dados';
      } finally {
        this.isLoading = false;
      }
    }
  
    /**
     * Recarrega a lista de disciplinas
     */
    async recarregar(): Promise<void> {
      await this.carregar();
    }
  
    /**
     * Exclui uma disciplina
     */
    async excluir(disciplinaId: number): Promise<void> {
      if (!confirm('Tem certeza que deseja excluir esta disciplina?')) {
        return;
      }
  
      try {
        const response = await this.authService.authenticatedFetch(`/disciplinas/${disciplinaId}`, {
          method: 'DELETE'
        });
  
        if (!response.ok) {
          throw new Error('Erro ao excluir disciplina');
        }
  
        // Remover da lista local
        this.disciplinas = this.disciplinas.filter(disc => disc.id !== disciplinaId);
        console.log('Disciplina excluída com sucesso');
  
      } catch (error: any) {
        console.error('Erro ao excluir disciplina:', error);
        this.errorMessage = 'Erro ao excluir disciplina';
      }
    }
  
    /**
     * Edita uma disciplina
     */
    editar(disciplinaId: number): void {
      const disciplina = this.disciplinas.find(p => p.id === disciplinaId);
      if (disciplina) {
        this.abrirModalEdicao(disciplina);
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
     * Abre o modal com os detalhes do disciplina (modo visualização)
     */
    abrirModal(disciplina: Disciplina): void {
      this.selectedDisciplina = disciplina;
      this.modalMode = ModalMode.VIEW;
      this.showModal = true;
    }
  
    /**
     * Abre o modal para criação de novo disciplina
     */
    abrirModalCriacao(): void {
      this.selectedDisciplina = null;
      this.modalMode = ModalMode.CREATE;
      this.formData = {
        id: 0,
        nome: ''
      };
      this.showModal = true;
    }
  
    /**
     * Abre o modal para edição de disciplina
     */
    abrirModalEdicao(disciplina: Disciplina): void {
      this.selectedDisciplina = disciplina;
      this.modalMode = ModalMode.EDIT;
      this.formData = { ...disciplina }; // Cópia dos dados para edição
      this.showModal = true;
    }
  
    /**
     * Fecha o modal
     */
    fecharModal(): void {
      this.showModal = false;
      this.selectedDisciplina = null;
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
        console.error('Erro ao salvar disciplina:', error);
        this.errorMessage = error.message || 'Erro ao salvar disciplina';
      } finally {
        this.isSubmitting = false;
      }
    }
  
    /**
     * Cria uma nova disciplina
     */
    private async create(): Promise<void> {
      const response = await this.authService.authenticatedFetch('/disciplinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: this.formData.nome
        })
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Erro ao criar disciplina');
      }
    }
  
    /**
     * Atualiza uma disciplina existente
     */
    private async atualizar(): Promise<void> {
      const response = await this.authService.authenticatedFetch(`/disciplinas/${this.formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: this.formData.nome
        })
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Erro ao atualizar disciplina');
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
      return true;
    }
  
    /**
     * Retorna o título do modal baseado no modo
     */
    getModalTitle(): string {
      switch (this.modalMode) {
        case ModalMode.VIEW:
          return 'Detalhes da Disciplina';
        case ModalMode.EDIT:
          return 'Editar Disciplina';
        case ModalMode.CREATE:
          return 'Nova Disciplina';
        default:
          return 'Disciplina';
      }
    }
}
