import type { MatrixChunk } from "../types";

export const splitMatrixA = (
  matrixA: number[],
  rowsA: number,
  colsA: number,
  numChunks: number
): MatrixChunk[] => {
  if (numChunks <= 0) {
    return [];
  }

  const chunks: MatrixChunk[] = [];
  const baseRows = Math.floor(rowsA / numChunks);
  const remainder = rowsA % numChunks;

  let currentRow = 0;

  for (let chunkId = 0; chunkId < numChunks; chunkId += 1) {
    const rowsForChunk = baseRows + (chunkId < remainder ? 1 : 0);
    const startIndex = currentRow * colsA;
    const endIndex = startIndex + rowsForChunk * colsA;
    const matrixAChunk = matrixA.slice(startIndex, endIndex);

    chunks.push({
      chunkId,
      matrixAChunk,
      rowsAChunk: rowsForChunk,
    });

    currentRow += rowsForChunk;
  }

  return chunks;
};
