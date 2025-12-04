export type Position = [number, number] | [number, number, number];

export type NullablePosition = Position | [null, null] | [null, null, null];

export type STDPosition = [number, number, number];

export type PositionObject = {
  x: number;
  y: number;
  z?: number;
};
