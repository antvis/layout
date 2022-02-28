import { PointTuple } from '../types';

/**
 * @fileOverview quad
 * @author shiwu.wyy@antfin.com
 */

interface QuadProps {
  xmid: number;
  ymid: number;
  length: number;
  massCenter?: PointTuple;
  mass?: number;
}

export default class Quad {
  public xmid: number;
  public ymid: number;
  public length: number;
  public massCenter: PointTuple;
  public mass: number;
  constructor(params: QuadProps) {
    /**
     * the center position of this quad
     * @type  {number}
     */
    this.xmid = params.xmid;
    /**
     * the center position of this quad
     * @type  {number}
     */
    this.ymid = params.ymid;
    /**
     * the length of this quad
     * @type  {number}
     */
    this.length = params.length;
    /**
     * the mass center of this quad
     * @type  {number}
     */
    this.massCenter = params.massCenter || [0, 0];
    /**
     * the mass of this quad
     * @type  {number}
     */
    this.mass = params.mass || 1;
  }
  getLength(): number {
    return this.length;
  }
  contains(x: number, y: number): boolean {
    const halfLen = this.length / 2;
    return x <= this.xmid + halfLen && x >= this.xmid - halfLen && y <= this.ymid + halfLen && y >= this.ymid - halfLen;
  }
  // northwest quadrant
  // tslint:disable-next-line
  NW(): Quad {
    const x = this.xmid - this.length / 4;
    const y = this.ymid + this.length / 4;
    const len = this.length / 2;
    const params: QuadProps = {
      xmid: x,
      ymid: y,
      length: len
    };
    return new Quad(params);
  }
  // northeast
  // tslint:disable-next-line
  NE(): Quad {
    const x = this.xmid + this.length / 4;
    const y = this.ymid + this.length / 4;
    const len = this.length / 2;
    const params = {
      xmid: x,
      ymid: y,
      length: len
    };
    return new Quad(params);
  }
  // southwest
  // tslint:disable-next-line
  SW(): Quad {
    const x = this.xmid - this.length / 4;
    const y = this.ymid - this.length / 4;
    const len = this.length / 2;
    const params = {
      xmid: x,
      ymid: y,
      length: len
    };
    return new Quad(params);
  }
  // southeast
  // tslint:disable-next-line
  SE(): Quad {
    const x = this.xmid + this.length / 4;
    const y = this.ymid - this.length / 4;
    const len = this.length / 2;
    const params = {
      xmid: x,
      ymid: y,
      length: len
    };
    return new Quad(params);
  }
}
