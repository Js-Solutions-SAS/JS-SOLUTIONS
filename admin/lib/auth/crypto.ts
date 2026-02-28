function toBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = toBytes(left);
  const rightBytes = toBytes(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);

  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let i = 0; i < maxLength; i += 1) {
    const leftByte = i < leftBytes.length ? leftBytes[i] : 0;
    const rightByte = i < rightBytes.length ? rightBytes[i] : 0;
    mismatch |= leftByte ^ rightByte;
  }

  return mismatch === 0;
}

export async function fixedDelay(minMs = 200, jitterMs = 140): Promise<void> {
  const delayMs = minMs + Math.floor(Math.random() * jitterMs);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
