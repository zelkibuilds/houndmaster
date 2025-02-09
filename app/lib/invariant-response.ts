export function invariantResponse(
  condition: boolean,
  status = 400
): asserts condition {
  if (!condition) {
    throw new Response(null, { status });
  }
}
