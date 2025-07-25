import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para os dados da matrícula
interface Matricula {
  id: number;
  numero: string;
  data: string;
  idAluno: number;
}

// Interface para os dados do aluno
interface Aluno {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
}

// Enum para os modos do modal
enum ModalMode {
  VIEW = 'view',
  CREATE = 'create',
}

@Component({
  selector: 'app-matriculas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './matriculas-page.component.html',
  styleUrl: './matriculas-page.component.css',
})
export class MatriculasPageComponent {
  matriculas: Matricula[] = [];
  alunos: Aluno[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Propriedades do modal
  showModal: boolean = false;
  selectedMatricula: Matricula | null = null;
  modalMode: ModalMode = ModalMode.VIEW;

  // Enum para usar no template
  ModalMode = ModalMode;

  // Dados do formulário
  formData: Matricula = {
    id: 0,
    numero: '',
    data: '',
    idAluno: 0,
  };

  // Estado do formulário
  isSubmitting: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Método executado quando o componente é inicializado
   */
  async ngOnInit() {
    await this.carregar();
    await this.carregarAlunos();
  }
  /**
   * Adiciona um novo matricula
   */
  async inserir() {
    this.abrirModalCriacao();
  }

  /**
   * Busca a lista de matriculas na API
   */
  async carregar(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Fazer requisição GET autenticada
      const response = await this.authService.authenticatedFetch('/matriculas');

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      // Converter resposta para JSON
      this.matriculas = await response.json();

      console.log('matriculas carregados:', this.matriculas);
    } catch (error: any) {
      console.error('Erro ao carregar matriculas:', error);
      this.errorMessage = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Busca a lista de alunos na API
   */
  async carregarAlunos(): Promise<void> {
    try {
      const response = await this.authService.authenticatedFetch('/alunos');

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      this.alunos = await response.json();
      console.log('Alunos carregados:', this.alunos);
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error);
      this.errorMessage = error.message || 'Erro ao carregar alunos';
    }
  }

  /**
   * Recarrega a lista de matriculas
   */
  async recarregar(): Promise<void> {
    await this.carregar();
  }

  /**
   * Exclui um matricula
   */
  async excluir(matriculaId: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este matricula?')) {
      return;
    }

    try {
      const response = await this.authService.authenticatedFetch(
        `/matriculas/${matriculaId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir matricula');
      }

      // Remover da lista local
      this.matriculas = this.matriculas.filter((mat) => mat.id !== matriculaId);
      console.log('matricula excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir matricula:', error);
      this.errorMessage = 'Erro ao excluir matricula';
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
   * Abre o modal com os detalhes do matricula (modo visualização)
   */
  abrirModal(matricula: Matricula): void {
    this.selectedMatricula = matricula;
    this.modalMode = ModalMode.VIEW;
    this.showModal = true;
  }

  /**
   * Abre o modal para criação de novo matricula
   */
  abrirModalCriacao(): void {
    this.selectedMatricula = null;
    this.modalMode = ModalMode.CREATE;
    this.formData = {
      id: 0,
      numero: '',
      data: '',
      idAluno: 0,
    };
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  fecharModal(): void {
    this.showModal = false;
    this.selectedMatricula = null;
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
      }

      this.fecharModal();
      await this.carregar(); // Recarrega a lista
    } catch (error: any) {
      console.error('Erro ao salvar matricula:', error);
      this.errorMessage = error.message || 'Erro ao salvar matricula';
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Cria um novo matricula
   */
  private async create(): Promise<void> {
    const response = await this.authService.authenticatedFetch('/matriculas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero: this.formData.numero,
        data: this.formData.data,
        idAluno: this.formData.idAluno,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao criar matricula');
    }
  }

  /**
   * Atualiza um matricula existente
   */
  private async atualizar(): Promise<void> {
    const response = await this.authService.authenticatedFetch(
      `/matriculas/${this.formData.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: this.formData.numero,
          data: this.formData.data,
          idAluno: this.formData.idAluno,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Erro ao atualizar matricula');
    }
  }

  /**
   * Valida os dados do formulário
   */
  private validarFormulario(): boolean {
    if (!this.formData.numero.trim()) {
      this.errorMessage = 'Número é obrigatório';
      return false;
    }
    if (!this.formData.data.trim()) {
      this.errorMessage = 'Data é obrigatória';
      return false;
    }
    if (this.formData.idAluno == 0) {
      this.errorMessage = 'Selecione um aluno';
      return false;
    }
    return true;
  }

  /**
   * Retorna o nome do aluno pelo ID
   */
  getNomeAluno(idAluno: number): string {
    const aluno = this.alunos.find((a) => a.id === idAluno);
    return aluno ? `${aluno.nome} (${aluno.email})` : `ID: ${idAluno}`;
  }

  /**
   * Retorna o título do modal baseado no modo
   */
  getModalTitle(): string {
    switch (this.modalMode) {
      case ModalMode.VIEW:
        return 'Detalhes da Matrícula';
      case ModalMode.CREATE:
        return 'Novo Matrícula';
      default:
        return 'Matrícula';
    }
  }
}
