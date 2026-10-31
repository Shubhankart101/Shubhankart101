import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiBaseUrl, createContact, getGithubRepos, getProfile, getProject, getProjects } from './api.js'
import { filterRepositories, summarizeRepositories } from './repositoryStats.js'

function jsonResponse(data, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(data),
  }
}

const repositories = [
  { name: 'CloudKit', description: 'Cloud platform tooling', language: 'Python', stars: 5, forks: 2, watchers: 7, openIssues: 1, updatedAt: '2026-10-10T12:00:00Z', isFork: false, isArchived: false },
  { name: 'PipelineLab', description: 'Build pipeline examples', language: 'Python', stars: 3, forks: 1, watchers: 4, openIssues: 2, updatedAt: '2026-10-12T12:00:00Z', isFork: true, isArchived: false },
  { name: 'SiteNotes', description: 'Static documentation', language: 'HTML', stars: 2, forks: 0, watchers: 2, openIssues: 0, updatedAt: '2026-10-11T12:00:00Z', isFork: false, isArchived: true },
]

describe('portfolio API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses the configured API base URL for static hosting', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/')
    vi.resetModules()
    const { apiBaseUrl: configuredApiBaseUrl, getProfile: getConfiguredProfile } = await import('./api.js')
    fetch.mockResolvedValue(jsonResponse({ name: 'Shubhankar Thapliyal' }))

    await getConfiguredProfile()

    expect(configuredApiBaseUrl).toBe('https://api.example.com/api')
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/profile/', { signal: undefined, headers: {} })
  })

  it('keeps the relative API root for local development', () => {
    expect(apiBaseUrl).toBe('/api')
  })

  it('loads the profile JSON from the expected endpoint', async () => {
    const profile = { name: 'Shubhankar Thapliyal' }
    fetch.mockResolvedValue(jsonResponse(profile))

    await expect(getProfile()).resolves.toEqual(profile)
    expect(fetch).toHaveBeenCalledWith('/api/profile/', { signal: undefined, headers: {} })
  })

  it('encodes project search and category parameters', async () => {
    fetch.mockResolvedValue(jsonResponse([]))

    await getProjects({ q: ' cloud & api ', category: 'DevOps' })

    expect(fetch.mock.calls[0][0]).toBe('/api/projects/?q=cloud+%26+api&category=DevOps')
  })

  it('omits empty and default project filters', async () => {
    fetch.mockResolvedValue(jsonResponse([]))

    await getProjects({ q: '   ', category: 'All' })

    expect(fetch.mock.calls[0][0]).toBe('/api/projects/')
  })

  it('encodes project slugs and forwards abort signals', async () => {
    const controller = new AbortController()
    fetch.mockResolvedValue(jsonResponse({ slug: 'Project name' }))

    await getProject('Project name', { signal: controller.signal })

    expect(fetch.mock.calls[0][0]).toBe('/api/projects/Project%20name/')
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal)
  })

  it('posts contact data as JSON', async () => {
    const values = { name: 'Alex', email: 'alex@example.com', message: 'A sufficiently long project message.' }
    fetch.mockResolvedValue(jsonResponse({ id: 5 }))

    await expect(createContact(values)).resolves.toEqual({ id: 5 })
    expect(fetch.mock.calls[0][0]).toBe('/api/contact/')
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
  })

  it('surfaces the first API validation message', async () => {
    fetch.mockResolvedValue(jsonResponse({ email: ['Enter a valid email address.'] }, 400))

    await expect(createContact({})).rejects.toThrow('Enter a valid email address.')
  })

  it('uses a safe message when an error response is not JSON', async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: vi.fn().mockRejectedValue(new Error('invalid json')) })

    await expect(getProjects()).rejects.toThrow('Something went wrong. Please try again.')
  })

  it('loads all repository pages and normalizes GitHub stats', async () => {
    const rawRepo = {
      name: 'CloudKit', full_name: 'Shubhankart101/CloudKit', html_url: 'https://github.com/Shubhankart101/CloudKit',
      description: 'Cloud platform tooling', language: 'Python', stargazers_count: 5, forks_count: 2,
      watchers_count: 7, open_issues_count: 1, updated_at: '2026-10-10T12:00:00Z', fork: false, archived: false,
    }
    const nextPage = 'https://api.github.com/users/Shubhankart101/repos?per_page=100&page=2&sort=full_name'
    fetch.mockResolvedValueOnce(jsonResponse(Array(100).fill(rawRepo), 200, { Link: `<${nextPage}>; rel="next"` }))
    fetch.mockResolvedValueOnce(jsonResponse([rawRepo]))

    const result = await getGithubRepos()

    expect(result).toHaveLength(101)
    expect(result[0]).toMatchObject({ name: 'CloudKit', language: 'Python', stars: 5, forks: 2, openIssues: 1 })
    expect(fetch).toHaveBeenNthCalledWith(2, nextPage, expect.any(Object))
  })

  it('surfaces GitHub API rate-limit messages', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ message: 'API rate limit exceeded' }, 403))

    await expect(getGithubRepos()).rejects.toThrow('API rate limit exceeded')
  })

  it('summarizes repository totals and language groups', () => {
    expect(summarizeRepositories(repositories)).toEqual({
      repositories: 3,
      stars: 10,
      forks: 3,
      watchers: 13,
      openIssues: 3,
      sourceRepositories: 2,
      forkRepositories: 1,
      archivedRepositories: 1,
      languages: [
        { name: 'Python', repositories: 2, stars: 8, forks: 3 },
        { name: 'HTML', repositories: 1, stars: 2, forks: 0 },
      ],
    })
  })

  it('filters repositories by query, language, and source/fork status', () => {
    expect(filterRepositories(repositories, { query: 'build', language: 'Python', kind: 'fork' }).map((repo) => repo.name)).toEqual(['PipelineLab'])
    expect(filterRepositories(repositories, { kind: 'archived' }).map((repo) => repo.name)).toEqual(['SiteNotes'])
    expect(filterRepositories(repositories, { sort: 'stars' }).map((repo) => repo.name)).toEqual(['CloudKit', 'PipelineLab', 'SiteNotes'])
  })
})
