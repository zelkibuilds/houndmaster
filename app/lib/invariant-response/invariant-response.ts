interface InvariantResponseOptions {
  status?: number;
  message?: string;
}

export function invariantResponse(
  condition: boolean,
  options: InvariantResponseOptions = {}
): asserts condition {
  if (!condition) {
    const { status = 400, message } = options;

    if (message) {
      console.error(`[Invariant Response Error] Status ${status}: ${message}`);
    }

    throw new Response(null, { status });
  }
}
