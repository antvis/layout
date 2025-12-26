import EventEmitter from '@antv/event-emitter';
import { SimulationOptions } from './types';

export type { SimulationOptions };

export abstract class BaseSimulation<
  T extends SimulationOptions = SimulationOptions,
> extends EventEmitter {
  protected iteration = 0;
  protected judgingDistance = Infinity;
  protected running = false;

  protected options!: T;

  private tickCallback: (() => void) | null = null;
  private endCallback: (() => void) | null = null;
  private timer: number = 0;

  initialize(options: T) {
    this.options = options;

    this.iteration = 0;
    this.judgingDistance = Infinity;
  }

  on(event: 'tick' | 'end', cb: () => void) {
    if (event === 'tick') this.tickCallback = cb;
    if (event === 'end') this.endCallback = cb;
    return this;
  }

  tick(iterations = 1) {
    for (let i = 0; i < iterations; i++) {
      const distance = this.runOneStep();
      this.judgingDistance = distance;
      this.iteration++;
      this.tickCallback?.();
    }
    return this;
  }

  restart() {
    if (this.running) return this;

    const {
      maxIteration = 500,
      minMovement = 0,
      animate = true,
    } = this.options;

    /** 非动画 or 非浏览器环境 */
    if (!animate || typeof window === 'undefined') {
      while (
        this.iteration < maxIteration &&
        (this.judgingDistance > minMovement || this.iteration < 1)
      ) {
        this.tick(1);
      }

      Promise.resolve().then(() => {
        this.endCallback?.();
      });

      return this;
    }

    /** 动画模式 */
    this.running = true;
    this.timer = window.setInterval(() => {
      this.tick(1);

      if (
        this.iteration >= maxIteration ||
        this.judgingDistance < minMovement
      ) {
        this.stop();
        this.endCallback?.();
      }
    }, 0);

    return this;
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
    }
    return this;
  }

  protected abstract runOneStep(): number;
}
