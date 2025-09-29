import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { UserService } from '../../../services/user.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', [
      'getAllUsers',
      'createUser',
      'updateUser',
      'deleteUser'
    ]);

    // Mock do retorno dos métodos
    mockUserService.getAllUsers.and.returnValue(of([]));
    mockUserService.createUser.and.returnValue(of({} as any));
    mockUserService.updateUser.and.returnValue(of({} as any));
    mockUserService.deleteUser.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [
        UserListComponent,
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(mockUserService.getAllUsers).toHaveBeenCalled();
  });

  it('should apply filter correctly', () => {
    const mockEvent = {
      target: { value: 'test' }
    } as any;

    component.applyFilter(mockEvent);
    expect(component.dataSource.filter).toBe('test');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2023-01-01');
    const formatted = component.formatDate(testDate);
    expect(formatted).toBe('01/01/2023');
  });

  it('should get correct department class', () => {
    expect(component.getDepartmentClass('Tecnologia')).toBe('tech');
    expect(component.getDepartmentClass('Marketing')).toBe('marketing');
    expect(component.getDepartmentClass('Unknown')).toBe('default');
  });

  it('should get correct department icon', () => {
    expect(component.getDepartmentIcon('Tecnologia')).toBe('computer');
    expect(component.getDepartmentIcon('Marketing')).toBe('campaign');
    expect(component.getDepartmentIcon('Unknown')).toBe('business');
  });
});
