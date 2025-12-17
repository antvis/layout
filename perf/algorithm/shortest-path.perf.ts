import { floydWarshall, johnson } from '@antv/layout';
import { Test } from 'iperf';

/**
 * Generate a random connected graph adjacency matrix
 */
function generateRandomGraph(n: number, density: number = 0.3): number[][] {
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(Infinity),
  );

  // Initialize diagonal to 0
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 0;
  }

  // Generate random edges with given density
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < density) {
        const weight = Math.floor(Math.random() * 10) + 1;
        matrix[i][j] = weight;
        matrix[j][i] = weight; // undirected graph
      }
    }
  }

  // Ensure connectivity by creating a spanning tree
  for (let i = 1; i < n; i++) {
    const parent = Math.floor(Math.random() * i);
    if (matrix[parent][i] === Infinity) {
      const weight = Math.floor(Math.random() * 10) + 1;
      matrix[parent][i] = weight;
      matrix[i][parent] = weight;
    }
  }

  return matrix;
}

/**
 * Create a performance test for shortest path algorithm
 */
function createShortestPathTest(
  algorithm: 'floydWarshall' | 'floydWarshallTypedArray' | 'johnson',
  nodeCount: number,
  density: number = 0.1,
): Test {
  const algorithmFunctions = {
    floydWarshall,
    // floydWarshallTypedArray,
    johnson,
  };

  const test: Test = async (context) => {
    const { perf } = context;

    // Generate test graph
    const adjMatrix = generateRandomGraph(nodeCount, density);

    const testName = `${algorithm} (${nodeCount} nodes, density: ${density})`;

    // Execute performance test
    await perf.evaluate(testName, () => {
      algorithmFunctions[algorithm](adjMatrix);
    });

    console.log(`${testName} completed.`);
  };

  test.iteration = 1;
  return test;
}

// Test configurations: node counts to test
const nodeCounts = [500, 1000, 1500, 2000, 2500];
const density = 0.1; // Lower density for larger graphs

// Floyd-Warshall tests
export const floydWarshall500 = createShortestPathTest(
  'floydWarshall',
  nodeCounts[0],
  density,
);
export const floydWarshall1000 = createShortestPathTest(
  'floydWarshall',
  nodeCounts[1],
  density,
);
export const floydWarshall1500 = createShortestPathTest(
  'floydWarshall',
  nodeCounts[2],
  density,
);
export const floydWarshall2000 = createShortestPathTest(
  'floydWarshall',
  nodeCounts[3],
  density,
);
export const floydWarshall2500 = createShortestPathTest(
  'floydWarshall',
  nodeCounts[4],
  density,
);

// Floyd-Warshall TypedArray tests
// export const floydWarshallTypedArray500 = createShortestPathTest(
//   'floydWarshallTypedArray',
//   nodeCounts[0],
//   density,
// );
// export const floydWarshallTypedArray1000 = createShortestPathTest(
//   'floydWarshallTypedArray',
//   nodeCounts[1],
//   density,
// );
// export const floydWarshallTypedArray1500 = createShortestPathTest(
//   'floydWarshallTypedArray',
//   nodeCounts[2],
//   density,
// );
// export const floydWarshallTypedArray2000 = createShortestPathTest(
//   'floydWarshallTypedArray',
//   nodeCounts[3],
//   density,
// );
// export const floydWarshallTypedArray2500 = createShortestPathTest(
//   'floydWarshallTypedArray',
//   nodeCounts[4],
//   density,
// );

// Johnson's Algorithm tests
export const johnson500 = createShortestPathTest(
  'johnson',
  nodeCounts[0],
  density,
);
export const johnson1000 = createShortestPathTest(
  'johnson',
  nodeCounts[1],
  density,
);
export const johnson1500 = createShortestPathTest(
  'johnson',
  nodeCounts[2],
  density,
);
export const johnson2000 = createShortestPathTest(
  'johnson',
  nodeCounts[3],
  density,
);
export const johnson2500 = createShortestPathTest(
  'johnson',
  nodeCounts[4],
  density,
);
