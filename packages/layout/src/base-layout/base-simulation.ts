import EventEmitter from '@antv/event-emitter';

export interface SimulationOptions {
  /**
   * <zh/> 最大迭代次数，若为 0 则将自动调整
   *
   * <en/> Maximum number of iterations, if it is 0, it will be automatically adjusted
   * @defaultValue 0
   */
  maxIteration?: number;
  /**
   * <zh/> 当一次迭代的平均/最大/最小（根据distanceThresholdMode决定）移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
   *
   * <en/> When the average/max/min (depending on distanceThresholdMode) movement length of one iteration is less than this value, the iteration will stop. The smaller the number, the more converged the layout, and the longer the time it takes to use
   * @defaultValue 0.4
   */
  minMovement?: number;
}

export abstract class BaseSimulation<
  T extends SimulationOptions = SimulationOptions,
> extends EventEmitter {
  protected iteration = 0;
  protected judgingDistance = Infinity;
  protected running = false;

  protected options: T;

  private tickCallback: (() => void) | null = null;
  private endCallback: (() => void) | null = null;
  private timer: number = 0;

  initialize(options: T) {
    this.options = options;

    this.iteration = 0;
    this.judgingDistance = Infinity;
    this.restart();
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
    }
    return this;
  }

  restart() {
    if (this.running) return this;

    const { maxIteration = 500, minMovement = 0 } = this.options;
    if (typeof window === 'undefined') {
      while (
        this.iteration < maxIteration &&
        (this.judgingDistance > minMovement || this.iteration < 1)
      ) {
        this.tick(1);
      }
      this.endCallback?.();
      return this;
    }

    this.running = true;
    this.timer = window.setInterval(() => {
      this.tick(1);
      this.tickCallback?.();

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
