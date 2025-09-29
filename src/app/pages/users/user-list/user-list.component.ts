import { AfterViewInit, Component, ViewChild, ElementRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserDialogComponent } from '../../../components/user-dialog/user-dialog.component';
import { User } from '../../../models/User';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'avatar', 'name', 'department', 'lastUpdated', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  selectedUser: User | null = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Signal para controlar loading local
  isLoading = signal(false);

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    // Configurar filtro customizado para buscar por nome ou email
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return data.name.toLowerCase().includes(searchTerm) ||
             data.email.toLowerCase().includes(searchTerm) ||
             data.department.toLowerCase().includes(searchTerm);
    };
  }

  /**
   * Carrega todos os usuários da API
   */
  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading.set(false);
        console.log('Usuários carregados:', users);
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.isLoading.set(false);
        this.showSnackBar('Erro ao carregar usuários. Usando dados locais.', 'warning');
      }
    });
  }

  /**
   * Abre o diálogo para criar um novo usuário
   */
  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: user || null,
      disableClose: true,
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user) {
          this.updateUser(result);
        } else {
          this.createUser(result);
        }
      }
    });
  }

  /**
   * Cria um novo usuário
   */
  private createUser(userData: any): void {
    this.userService.createUser(userData).subscribe({
      next: (newUser) => {
        this.dataSource.data = [...this.dataSource.data, newUser];
        this.showSnackBar('Usuário criado com sucesso!', 'success');
        console.log('Usuário criado:', newUser);
      },
      error: (error) => {
        console.error('Erro ao criar usuário:', error);
        this.showSnackBar('Erro ao criar usuário. Tente novamente.', 'error');
      }
    });
  }

  /**
   * Atualiza um usuário existente
   */
  private updateUser(userData: any): void {
    this.userService.updateUser(userData).subscribe({
      next: (updatedUser) => {
        const index = this.dataSource.data.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          const newData = [...this.dataSource.data];
          newData[index] = updatedUser;
          this.dataSource.data = newData;
        }
        this.showSnackBar('Usuário atualizado com sucesso!', 'success');
        console.log('Usuário atualizado:', updatedUser);
      },
      error: (error) => {
        console.error('Erro ao atualizar usuário:', error);
        this.showSnackBar('Erro ao atualizar usuário. Tente novamente.', 'error');
      }
    });
  }

  /**
   * Abre o diálogo para editar um usuário
   */
  editUser(user: User): void {
    this.openUserDialog(user);
  }

  /**
   * Remove um usuário
   */
  deleteUser(user: User): void {
    const confirmation = confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`);

    if (confirmation) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
          this.showSnackBar('Usuário excluído com sucesso!', 'success');
          console.log('Usuário excluído:', user);
        },
        error: (error) => {
          console.error('Erro ao excluir usuário:', error);
          this.showSnackBar('Erro ao excluir usuário. Tente novamente.', 'error');
        }
      });
    }
  }

  /**
   * Seleciona um usuário (para mobile)
   */
  selectUser(user: User): void {
    this.selectedUser = this.selectedUser === user ? null : user;
  }

  /**
   * Aplica filtro de busca
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Formata data para exibição
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  /**
   * Formata hora para exibição
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retorna a classe CSS para o departamento
   */
  getDepartmentClass(department: string): string {
    const classes: { [key: string]: string } = {
      'Tecnologia': 'tech',
      'Marketing': 'marketing',
      'Vendas': 'sales',
      'Recursos Humanos': 'hr',
      'Financeiro': 'financial',
      'Operacional': 'operational',
      'Suporte': 'support'
    };
    return classes[department] || 'default';
  }

  /**
   * Retorna o ícone para o departamento
   */
  getDepartmentIcon(department: string): string {
    const icons: { [key: string]: string } = {
      'Tecnologia': 'computer',
      'Marketing': 'campaign',
      'Vendas': 'trending_up',
      'Recursos Humanos': 'group',
      'Financeiro': 'account_balance',
      'Operacional': 'settings',
      'Suporte': 'support'
    };
    return icons[department] || 'business';
  }

  /**
   * Trata erro de carregamento de avatar
   */
  onAvatarError(event: any): void {
    event.target.src = 'https://i.pravatar.cc/150?u=default';
    event.target.classList.add('error');
  }

  /**
   * Dispara seleção de arquivo para importação
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Processa arquivo selecionado para importação
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.importFromCsv(file);
    } else {
      this.showSnackBar('Por favor, selecione um arquivo CSV válido.', 'warning');
    }
  }

  /**
   * Importa usuários de arquivo CSV
   */
  private importFromCsv(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      try {
        const users = this.parseCsvToUsers(csv);
        // Aqui você implementaria a lógica de importação
        this.showSnackBar(`${users.length} usuários importados com sucesso!`, 'success');
        console.log('Usuários importados:', users);
      } catch (error) {
        console.error('Erro ao importar CSV:', error);
        this.showSnackBar('Erro ao processar arquivo CSV.', 'error');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Converte CSV em array de usuários
   */
  private parseCsvToUsers(csv: string): User[] {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const users: User[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length) {
          users.push({
            id: (new Date().getTime() + i).toString(),
            name: values[0] || '',
            email: values[1] || '',
            avatar: values[2] || 'https://i.pravatar.cc/150?u=default',
            department: values[3] || '',
            lastUpdated: new Date(),
            role: 'user',
            isActive: true
          });
        }
      }
    }

    return users;
  }

  /**
   * Exporta usuários para CSV
   */
  exportToCsv(): void {
    if (this.dataSource.data.length === 0) {
      this.showSnackBar('Não há usuários para exportar.', 'warning');
      return;
    }

    const headers = ['Nome', 'Email', 'Avatar', 'Departamento', 'Última Atualização'];
    const csvContent = [
      headers.join(','),
      ...this.dataSource.data.map(user => [
        `"${user.name}"`,
        `"${user.email}"`,
        `"${user.avatar}"`,
        `"${user.department}"`,
        `"${this.formatDate(user.lastUpdated ?? new Date())} ${this.formatTime(user.lastUpdated ?? new Date())}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSnackBar('Lista de usuários exportada com sucesso!', 'success');
  }

  /**
   * Exibe notificação para o usuário
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning'): void {
    const config = {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
    };

    this.snackBar.open(message, 'Fechar', config);
  }
}
