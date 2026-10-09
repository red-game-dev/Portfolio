import type { RandomSource } from "@/packages/math/random";

const MODULUS = 2147483647;
const MULTIPLIER = 16807;
// A Park-Miller generator follows its seed for its first draws; these are thrown away.
const WARM_UP = 3;

// A seeded random that starts over at every step from its seed and the step's number, so what a step draws
// depends only on the seed and when it is, never on how much was drawn before. Two daily voyages flown
// differently (one ship hit, the other not) still agree on everything that does not follow from that: the flares,
// the comets, the rocks and wrecks drifting in at the same moments.
export class StepRandom {
  private state = 1;

  constructor(private readonly seed: number) {
    this.reseed(0);
  }

  public readonly next: RandomSource = () => {
    this.state = (this.state * MULTIPLIER) % MODULUS;

    return (this.state - 1) / (MODULUS - 1);
  };

  public reseed(step: number): void {
    this.state = (((Math.abs(Math.floor(this.seed)) % MODULUS) * 48271 + (step % MODULUS) * 69621) % (MODULUS - 1)) + 1;

    for (let draw = 0; draw < WARM_UP; draw += 1) {
      this.next();
    }
  }
}
