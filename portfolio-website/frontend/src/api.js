export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const invalidResponseMessage = 'The API returned an invalid response. Check VITE_API_BASE_URL.'

async function request(path, { signal, ...options } = {}) {
  const response = await fetch(`${apiBaseUrl}/${path}`, {
    ...options,
    signal,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let payload = null
  if (response.status !== 204) {
    try {
      payload = await response.json()
    } catch {
      if (response.ok) throw new Error(invalidResponseMessage)
    }
  }

  if (!response.ok) {
    const firstError = payload && Object.values(payload).flat(Infinity)[0]
    throw new Error(typeof firstError === 'string' ? firstError : 'Something went wrong. Please try again.')
  }
  if (response.status !== 204 && payload === null) {
    throw new Error(invalidResponseMessage)
  }
  return payload
}

function requireObject(payload, resource) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`The ${resource} API returned an invalid response.`)
  }
  return payload
}

export function getProfile({ signal } = {}) {
  return request('profile/', { signal }).then((profile) => requireObject(profile, 'Profile'))
}

export function getProjects({ q = '', category = 'All', signal } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (category !== 'All') params.set('category', category)
  const query = params.size ? `?${params}` : ''
  return request(`projects/${query}`, { signal }).then((projects) => {
    if (!Array.isArray(projects)) throw new Error('The projects API returned an invalid response.')
    return projects
  })
}

export function getProject(slug, { signal } = {}) {
  return request(`projects/${encodeURIComponent(slug)}/`, { signal })
    .then((project) => requireObject(project, 'Project'))
}

export function createContact(values) {
  return request('contact/', { method: 'POST', body: JSON.stringify(values) })
}

export async function getGithubRepos({ signal } = {}) {
  const repos = []
  let page = 1

  while (true) {
    const url = `https://api.github.com/users/Shubhankart101/repos?per_page=100&page=${page}&sort=full_name`
    const response = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.message || 'GitHub repository statistics are temporarily unavailable.')
    }
    if (!Array.isArray(payload)) {
      throw new Error('GitHub returned an unexpected repository list.')
    }

    repos.push(...payload.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description || 'No repository description provided.',
      language: repo.language || 'Other',
      stars: Number(repo.stargazers_count || 0),
      forks: Number(repo.forks_count || 0),
      watchers: Number(repo.watchers_count || 0),
      openIssues: Number(repo.open_issues_count || 0),
      updatedAt: repo.updated_at,
      isFork: Boolean(repo.fork),
      isArchived: Boolean(repo.archived),
    })))

    if (payload.length < 100) break
    page += 1
  }

  return repos
}
