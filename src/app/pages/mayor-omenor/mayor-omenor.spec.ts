import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MayorOmenor } from './mayor-omenor';

describe('MayorOmenor', () => {
  let component: MayorOmenor;
  let fixture: ComponentFixture<MayorOmenor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MayorOmenor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MayorOmenor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
