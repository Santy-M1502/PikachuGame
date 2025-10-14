import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PokemonGenerationService {
  private readonly generationRanges: Record<number, { from: number; to: number }> = {
    1: { from: 1, to: 151 },
    2: { from: 152, to: 251 },
    3: { from: 252, to: 386 },
    4: { from: 387, to: 493 },
    5: { from: 494, to: 649 },
    6: { from: 650, to: 721 },
    7: { from: 722, to: 809 },
    8: { from: 810, to: 905 },
    9: { from: 906, to: 1025 },
  };

  getRange(gen: number) {
    return this.generationRanges[gen] || { from: 1, to: 151 };
  }

  getGenerations() {
    return Object.keys(this.generationRanges).map(Number);
  }
}
