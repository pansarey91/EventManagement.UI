import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';
import {
  EventCategoryDto,
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
  EventCategoryQueryDto,
  PagedResultDto,
} from '../models';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const mockCategories: EventCategoryDto[] = [
    {
      id: 'cat-1',
      name: 'Technology',
      description: 'Tech events and conferences',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'cat-2',
      name: 'Music & Concerts',
      description: 'Live musical performances',
      isActive: false,
      createdAt: '2026-01-02T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    },
  ];

  const mockPagedResult: PagedResultDto<EventCategoryDto> = {
    items: mockCategories,
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
        CategoryService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should retrieve paginated categories without query parameters', () => {
    let result: PagedResultDto<EventCategoryDto> | undefined;
    service.getAll().subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/eventcategories`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);

    expect(result).toEqual(mockPagedResult);
  });

  it('should retrieve paginated categories with query parameters', () => {
    const query: EventCategoryQueryDto = {
      pageNumber: 2,
      pageSize: 5,
      search: 'tech',
      sortBy: 'name',
      sortDirection: 'desc',
      isActive: true,
    };

    let result: PagedResultDto<EventCategoryDto> | undefined;
    service.getAll(query).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/eventcategories?pageNumber=2&pageSize=5&search=tech&sortBy=name&sortDirection=desc&isActive=true`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);

    expect(result).toEqual(mockPagedResult);
  });

  it('should retrieve a category by id via GET /api/eventcategories/:id', () => {
    const catId = 'cat-1';
    let result: EventCategoryDto | undefined;

    service.getById(catId).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/eventcategories/${catId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories[0]);

    expect(result).toEqual(mockCategories[0]);
  });

  it('should create a new category via POST /api/eventcategories', () => {
    const createDto: CreateEventCategoryDto = {
      name: 'Workshop',
      description: 'Hands-on learning sessions',
      isActive: true,
    };

    const createdCategory: EventCategoryDto = {
      id: 'cat-3',
      name: createDto.name,
      description: createDto.description,
      isActive: true,
      createdAt: '2026-03-01T12:00:00Z',
      updatedAt: null,
    };

    let result: EventCategoryDto | undefined;
    service.create(createDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/eventcategories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(createdCategory);

    expect(result).toEqual(createdCategory);
  });

  it('should update an existing category via PUT /api/eventcategories/:id', () => {
    const catId = 'cat-1';
    const updateDto: UpdateEventCategoryDto = {
      name: 'Technology & AI',
      description: 'Updated description',
      isActive: true,
    };

    const updatedCategory: EventCategoryDto = {
      ...mockCategories[0],
      name: updateDto.name,
      description: updateDto.description,
      updatedAt: '2026-03-01T15:00:00Z',
    };

    let result: EventCategoryDto | undefined;
    service.update(catId, updateDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/eventcategories/${catId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedCategory);

    expect(result).toEqual(updatedCategory);
  });

  it('should delete a category via DELETE /api/eventcategories/:id', () => {
    const catId = 'cat-1';
    let completed = false;

    service.delete(catId).subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/eventcategories/${catId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
