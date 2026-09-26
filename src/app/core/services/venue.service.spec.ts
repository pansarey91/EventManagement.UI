import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VenueService } from './venue.service';
import { environment } from '../../../environments/environment';
import {
  VenueDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueQueryDto,
  PagedResultDto,
} from '../models';

describe('VenueService', () => {
  let service: VenueService;
  let httpMock: HttpTestingController;

  const mockVenues: VenueDto[] = [
    {
      id: 'venue-1',
      name: 'Grand Expo Center',
      address: '100 Exhibition Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      capacity: 5000,
      contactPerson: 'Alice Johnson',
      contactNumber: '+13125550100',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'venue-2',
      name: 'Civic Auditorium',
      address: '250 Civic Center Dr',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60602',
      capacity: 1200,
      contactPerson: null,
      contactNumber: null,
      isActive: false,
      createdAt: '2026-01-15T12:00:00Z',
      updatedAt: '2026-02-01T15:00:00Z',
    },
  ];

  const mockPagedResult: PagedResultDto<VenueDto> = {
    items: mockVenues,
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
        VenueService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VenueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should retrieve paginated venues without query parameters', () => {
    let result: PagedResultDto<VenueDto> | undefined;
    service.getAll().subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/venues`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);

    expect(result).toEqual(mockPagedResult);
  });

  it('should retrieve paginated venues with query parameters', () => {
    const query: VenueQueryDto = {
      pageNumber: 2,
      pageSize: 5,
      search: 'expo',
      city: 'Chicago',
      sortBy: 'capacity',
      sortDirection: 'desc',
      isActive: true,
    };

    let result: PagedResultDto<VenueDto> | undefined;
    service.getAll(query).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/venues?pageNumber=2&pageSize=5&search=expo&city=Chicago&sortBy=capacity&sortDirection=desc&isActive=true`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);

    expect(result).toEqual(mockPagedResult);
  });

  it('should retrieve a venue by id via GET /api/venues/:id', () => {
    const venueId = 'venue-1';
    let result: VenueDto | undefined;

    service.getById(venueId).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/venues/${venueId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockVenues[0]);

    expect(result).toEqual(mockVenues[0]);
  });

  it('should create a new venue via POST /api/venues', () => {
    const createDto: CreateVenueDto = {
      name: 'Metropolitan Hall',
      address: '500 Park Ave',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10022',
      capacity: 800,
      contactPerson: 'Bob Smith',
      contactNumber: '+12125550199',
      isActive: true,
    };

    const createdVenue: VenueDto = {
      id: 'venue-3',
      ...createDto,
      isActive: true,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: null,
    };

    let result: VenueDto | undefined;
    service.create(createDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/venues`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(createdVenue);

    expect(result).toEqual(createdVenue);
  });

  it('should update an existing venue via PUT /api/venues/:id', () => {
    const venueId = 'venue-1';
    const updateDto: UpdateVenueDto = {
      name: 'Grand Expo & Conference Center',
      address: '100 Exhibition Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      capacity: 6000,
      contactPerson: 'Alice Johnson',
      contactNumber: '+13125550100',
      isActive: true,
    };

    const updatedVenue: VenueDto = {
      ...mockVenues[0],
      ...updateDto,
      updatedAt: '2026-03-01T12:00:00Z',
    };

    let result: VenueDto | undefined;
    service.update(venueId, updateDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/venues/${venueId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedVenue);

    expect(result).toEqual(updatedVenue);
  });

  it('should delete a venue via DELETE /api/venues/:id', () => {
    const venueId = 'venue-1';
    let completed = false;

    service.delete(venueId).subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/venues/${venueId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
