import type { ChunkResult } from "../types";

export const mergeChunkResults = (
  chunks: ChunkResult[],
  rowsA: number,
  colsB: number
): number[] => {
  if (chunks.length === 0) {
    return [];
  }

  const ordered = [...chunks].sort((a, b) => a.chunkId - b.chunkId);
  const result: number[] = new Array(rowsA * colsB);

  let offset = 0;
  for (const chunk of ordered) {
    for (const value of chunk.result) {
      result[offset] = value;
      offset += 1;
    }
  }

  return result;
};
