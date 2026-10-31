import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContact, getProfile, getProject, getProjects } from './api.js'

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }
}

describe('portfolio API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
})
