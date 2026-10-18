import { Stage } from "../core/Stage";

// How a stage is made: an adapter's code loads on first use, so a page that never needs 3D never downloads it.
export type StageFactory = () => Promise<Stage>;

// The one stage a page uses, from the first adapter that can draw here, tried in order. A stage that loses its GPU
// is dropped and the next ask goes on to the adapters after it; where none can draw, there is no stage and the host
// draws without one.
export class StageService {
  private readonly factories: StageFactory[];
  private next = 0;
  private current: Promise<Stage | null> | null = null;

  constructor(factories: StageFactory[]) {
    this.factories = factories;
  }

  public ready(): Promise<Stage | null> {
    this.current ??= this.choose();

    return this.current;
  }

  private async choose(): Promise<Stage | null> {
    while (this.next < this.factories.length) {
      const factory = this.factories[this.next];

      this.next += 1;

      try {
        const stage = await factory();

        if (await stage.prepare()) {
          stage.onLost(() => {
            this.current = null;
            stage.dispose();
          });

          return stage;
        }

        stage.dispose();
      } catch {
        // This adapter cannot load here; the next one may.
      }
    }

    return null;
  }
}
