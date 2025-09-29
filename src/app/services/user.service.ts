import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { User, UserCreate, UserResponse } from '../models/User';

export interface UserCreateDto {
  name: string;
  email: string;
  password: string;
  avatar: string;
  department: string;
}

export interface UserUpdateDto extends Partial<Omit<UserCreateDto, 'password'>> {
  id: string;
  password?: string; // Opcional para atualização
}

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseApiService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$ = this.loadingSubject.asObservable();

  // Signal para armazenar os usuários localmente
  private readonly usersSignal = signal<User[]>([]);
  public readonly users = this.usersSignal.asReadonly();

  // Dados mockados para fallback
  private readonly MOCK_USERS: User[] = [
    {
      id: '67781ba123456789abcdef01',
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      avatar: 'https://i.pravatar.cc/150?u=joao',
      department: 'Tecnologia',
      lastUpdated: new Date(),
      role: 'admin',
      isActive: true
    },
    {
      id: '67781ba123456789abcdef02',
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      avatar: 'https://i.pravatar.cc/150?u=maria',
      department: 'Marketing',
      lastUpdated: new Date(),
      role: 'manager',
      isActive: true
    },
    {
      id: '67781ba123456789abcdef03',
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@empresa.com',
      avatar: 'https://i.pravatar.cc/150?u=pedro',
      department: 'Vendas',
      lastUpdated: new Date(),
      role: 'user',
      isActive: true
    },
    {
      id: '67781ba123456789abcdef04',
      name: 'Ana Costa',
      email: 'ana.costa@empresa.com',
      avatar: 'https://i.pravatar.cc/150?u=ana',
      department: 'Recursos Humanos',
      lastUpdated: new Date(),
      role: 'manager',
      isActive: true
    },
  ];

  /**
   * Obtém todos os usuários
   */
  getAllUsers(): Observable<User[]> {
    this.setLoading(true);

    return this.http.get<UserResponse[]>(this.buildUrl('users'), this.httpOptions).pipe(
      map((users: UserResponse[]) => {
        const convertedUsers = users.map((user) => this.convertFromApi(user));
        this.usersSignal.set(convertedUsers);
        this.setLoading(false);
        return convertedUsers;
      }),
      catchError((error) => {
        console.warn('Erro ao buscar usuários da API, usando dados mockados:', error);
        this.usersSignal.set(this.MOCK_USERS);
        this.setLoading(false);
        return of(this.MOCK_USERS);
      })
    );
  }

  /**
   * Obtém um usuário por ID
   */
  getUserById(id: string): Observable<User> {
    this.setLoading(true);

    return this.http.get<UserResponse>(this.buildUrl(`users/${id}`), this.httpOptions).pipe(
      map((user: UserResponse) => {
        const convertedUser = this.convertFromApi(user);
        // Atualiza o usuário no array local
        const currentUsers = this.usersSignal();
        const index = currentUsers.findIndex((u) => u.id === id);
        if (index !== -1) {
          const updatedUsers = [...currentUsers];
          updatedUsers[index] = convertedUser;
          this.usersSignal.set(updatedUsers);
        }
        this.setLoading(false);
        return convertedUser;
      }),
      catchError((error) => {
        console.warn('Erro ao buscar usuário da API, usando dados mockados:', error);
        const mockUser = this.MOCK_USERS.find((u) => u.id === id);
        this.setLoading(false);
        if (mockUser) {
          return of(mockUser);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Cria um novo usuário
   */
  createUser(userData: UserCreateDto): Observable<User> {
    this.setLoading(true);

    const userForApi = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      avatar: userData.avatar,
      department: userData.department,
    };

    return this.http
      .post<UserResponse>(this.buildUrl('users'), userForApi, this.httpOptions)
      .pipe(
        map((newUser: UserResponse) => {
          const convertedUser = this.convertFromApi(newUser);
          const currentUsers = this.usersSignal();
          this.usersSignal.set([...currentUsers, convertedUser]);
          this.setLoading(false);
          return convertedUser;
        }),
        catchError((error) => {
          console.warn('Erro ao criar usuário na API, simulando criação:', error);
          // Simula criação local para desenvolvimento
          const mockUser: User = {
            id: new Date().getTime().toString(),
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            department: userData.department,
            lastUpdated: new Date(),
            role: 'admin',
            isActive: false
          };

          const currentUsers = this.usersSignal();
          this.usersSignal.set([...currentUsers, mockUser]);
          this.setLoading(false);

          return of(mockUser);
        })
      );
  }

  /**
   * Atualiza um usuário existente
   */
  updateUser(userData: UserUpdateDto): Observable<User> {
    this.setLoading(true);

    const userForApi: any = {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      department: userData.department,
    };

    // Só inclui password se foi fornecida
    if (userData.password) {
      userForApi.password = userData.password;
    }

    return this.http
      .put<UserResponse>(this.buildUrl(`users/${userData.id}`), userForApi, this.httpOptions)
      .pipe(
        map((updatedUser: UserResponse) => {
          const convertedUser = this.convertFromApi(updatedUser);
          const currentUsers = this.usersSignal();
          const index = currentUsers.findIndex((u) => u.id === userData.id);
          if (index !== -1) {
            const updatedUsers = [...currentUsers];
            updatedUsers[index] = convertedUser;
            this.usersSignal.set(updatedUsers);
          }
          this.setLoading(false);
          return convertedUser;
        }),
        catchError((error) => {
          console.warn('Erro ao atualizar usuário na API, simulando atualização:', error);
          // Simula atualização local para desenvolvimento
          const currentUsers = this.usersSignal();
          const index = currentUsers.findIndex((u) => u.id === userData.id);
          if (index !== -1) {
            const updatedUsers = [...currentUsers];
            updatedUsers[index] = {
              ...updatedUsers[index],
              name: userData.name || updatedUsers[index].name,
              email: userData.email || updatedUsers[index].email,
              avatar: userData.avatar || updatedUsers[index].avatar,
              department: userData.department || updatedUsers[index].department,
              lastUpdated: new Date(),
            };
            this.usersSignal.set(updatedUsers);
            this.setLoading(false);
            return of(updatedUsers[index]);
          }
          this.setLoading(false);
          return this.handleError(error);
        })
      );
  }

  /**
   * Remove um usuário
   */
  deleteUser(id: string): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(this.buildUrl(`users/${id}`), this.httpOptions).pipe(
      tap(() => {
        const currentUsers = this.usersSignal();
        const filteredUsers = currentUsers.filter((u) => u.id !== id);
        this.usersSignal.set(filteredUsers);
        this.setLoading(false);
      }),
      catchError((error) => {
        console.warn('Erro ao deletar usuário na API, simulando remoção:', error);
        // Simula remoção local para desenvolvimento
        const currentUsers = this.usersSignal();
        const filteredUsers = currentUsers.filter((u) => u.id !== id);
        this.usersSignal.set(filteredUsers);
        this.setLoading(false);

        return of(undefined);
      })
    );
  }

  /**
   * Converte resposta da API para modelo interno
   */
  private convertFromApi(apiUser: UserResponse): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      avatar: apiUser.avatar,
      department: apiUser.department,
      lastUpdated: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
      role: apiUser.role || 'user',
      isActive: apiUser.isActive ?? true,
    };
  }

  /**
   * Controla o estado de loading
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
