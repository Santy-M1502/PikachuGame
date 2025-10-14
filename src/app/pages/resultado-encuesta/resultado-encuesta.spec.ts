import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoEncuesta } from './resultado-encuesta';

describe('ResultadoEncuesta', () => {
  let component: ResultadoEncuesta;
  let fixture: ComponentFixture<ResultadoEncuesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoEncuesta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadoEncuesta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
