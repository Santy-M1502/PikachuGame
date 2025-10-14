import { TestBed } from '@angular/core/testing';

import { PokemonGenerationService } from './pokemon-generation.service';

describe('PokemonGenerationService', () => {
  let service: PokemonGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokemonGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
