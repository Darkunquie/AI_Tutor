export function success(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function paginated(data: unknown[], total: number, page: number, pageSize: number) {
  return Response.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export function created(data: unknown) {
  return success(data, 201);
}

export function noContent() {
  return new Response(null, { status: 204 });
}
