import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuePokemon } from './que-pokemon';

describe('QuePokemon', () => {
  let component: QuePokemon;
  let fixture: ComponentFixture<QuePokemon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuePokemon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuePokemon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
