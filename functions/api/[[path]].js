export async function onRequest({ request, params }) {
  const incoming = new URL(request.url)
  const tail = params.path ? params.path.join('/') : ''
  const target = new URL(`https://namify.onrender.com/api/${tail}`)
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.delete('accept-encoding')

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()

  return fetch(target.toString(), {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })
}
