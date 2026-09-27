import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RoleService } from './role.service';
import { environment } from '../../../environments/environment';
import {
  RoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryDto,
  PagedResultDto,
} from '../models';

describe('RoleService', () => {
  let service: RoleService;
  let httpMock: HttpTestingController;

  const mockRoles: RoleDto[] = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Platform Administrator',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'role-2',
      name: 'Organizer',
      description: 'Event Organizer',
      createdAt: '2026-01-02T10:00:00Z',
      updatedAt: null,
    },
  ];

  const mockPagedResult: PagedResultDto<RoleDto> = {
    items: mockRoles,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoleService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(RoleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRoles', () => {
    it('should send GET request to /api/roles with no params by default', () => {
      service.getRoles().subscribe((res) => {
        expect(res).toEqual(mockPagedResult);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/roles`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPagedResult);
    });

    it('should attach query params when provided', () => {
      const query: RoleQueryDto = {
        pageNumber: 2,
        pageSize: 5,
        search: 'admin',
        sortBy: 'name',
        sortDirection: 'desc',
      };

      service.getRoles(query).subscribe((res) => {
        expect(res.items.length).toBe(2);
      });

      const req = httpMock.expectOne((r) => r.url === `${environment.apiBaseUrl}/roles`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageNumber')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('5');
      expect(req.request.params.get('search')).toBe('admin');
      expect(req.request.params.get('sortBy')).toBe('name');
      expect(req.request.params.get('sortDirection')).toBe('desc');
      req.flush(mockPagedResult);
    });
  });

  describe('getRoleById', () => {
    it('should send GET request to /api/roles/:id', () => {
      service.getRoleById('role-1').subscribe((res) => {
        expect(res).toEqual(mockRoles[0]);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/roles/role-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRoles[0]);
    });
  });

  describe('createRole', () => {
    it('should send POST request to /api/roles with payload', () => {
      const dto: CreateRoleDto = {
        name: 'Staff',
        description: 'Check-in staff',
      };

      const created: RoleDto = {
        id: 'role-3',
        name: 'Staff',
        description: 'Check-in staff',
        createdAt: '2026-03-01T12:00:00Z',
        updatedAt: null,
      };

      service.createRole(dto).subscribe((res) => {
        expect(res).toEqual(created);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/roles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(created);
    });
  });

  describe('updateRole', () => {
    it('should send PUT request to /api/roles/:id with payload', () => {
      const dto: UpdateRoleDto = {
        name: 'Updated Admin',
        description: 'Updated description',
      };

      const updated: RoleDto = {
        id: 'role-1',
        name: 'Updated Admin',
        description: 'Updated description',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-03-02T12:00:00Z',
      };

      service.updateRole('role-1', dto).subscribe((res) => {
        expect(res).toEqual(updated);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/roles/role-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(updated);
    });
  });

  describe('deleteRole', () => {
    it('should send DELETE request to /api/roles/:id', () => {
      service.deleteRole('role-1').subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/roles/role-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
