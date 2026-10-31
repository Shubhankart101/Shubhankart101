async function request(path, { signal, ...options } = {}) {
  const response = await fetch(`/api/${path}`, {
    ...options,
    signal,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const firstError = payload && Object.values(payload).flat(Infinity)[0]
    throw new Error(typeof firstError === 'string' ? firstError : 'Something went wrong. Please try again.')
  }
  return payload
}

export function getProfile({ signal } = {}) {
  return request('profile/', { signal })
}

export function getProjects({ q = '', category = 'All', signal } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (category !== 'All') params.set('category', category)
  const query = params.size ? `?${params}` : ''
  return request(`projects/${query}`, { signal })
}

export function getProject(slug, { signal } = {}) {
  return request(`projects/${encodeURIComponent(slug)}/`, { signal })
}

export function createContact(values) {
  return request('contact/', { method: 'POST', body: JSON.stringify(values) })
}
