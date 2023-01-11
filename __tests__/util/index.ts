export function mathEqual(a: number, b: number) {
  return Math.abs(a - b) < 1;
}

export function numberEqual(a: number, b: number, gap?: number) {
  return Math.abs(a - b) <= (gap || 0.001);
}

/**
 * calculate the euclidean distance form p1 to p2
 * @param p1 
 * @param p2 
 * @returns 
 */
export function getEuclideanDistance(p1, p2) {
  const { data: p1d } = p1;
  const { data: p2d } = p2;
  return Math.sqrt(
    (p1d.x - p2d.x) * (p1d.x - p2d.x) + (p1d.y - p2d.y) * (p1d.y - p2d.y)
  );
} 