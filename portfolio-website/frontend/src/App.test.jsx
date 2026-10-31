import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Portfolio from './Portfolio.jsx'
import { createContact, getProfile, getProject, getProjects } from './api.js'

vi.mock('./api.js', () => ({
  createContact: vi.fn(),
  getProfile: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
}))

const projects = [
  {
    title: 'CollabDocs', slug: 'CollabDocs', summary: 'A collaborative document workspace.',
    description: 'Shared documents and team workflows.', category: 'Product',
    stack: ['Python', 'Django'], repo_url: 'https://github.com/Shubhankart101/CollabDocs', demo_url: '',
  },
  {
    title: 'DevTrack', slug: 'DevTrack', summary: 'Issue tracking with automated delivery.',
    description: 'A delivery-focused issue tracking API.', category: 'API',
    stack: ['Python', 'Django', 'Terraform'], repo_url: 'https://github.com/Shubhankart101/DevTrack', demo_url: '',
  },
]

function filterProjects({ q = '', category = 'All' } = {}) {
  return projects.filter((project) => {
    const haystack = `${project.title} ${project.summary} ${project.stack.join(' ')}`.toLowerCase()
    return haystack.includes(q.toLowerCase()) && (category === 'All' || project.category === category)
  })
}

describe('portfolio website', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getProfile.mockResolvedValue({
      name: 'Shubhankar Thapliyal', role: 'Azure DevOps Engineer | Technical Lead',
      location: 'New Delhi, India', email: 'shubhankar.thapliyal@gmail.com',
      linkedin: 'https://www.linkedin.com/in/shubhankarthapliyal',
      github: 'https://github.com/Shubhankart101', years_experience: 8,
      deployment_improvement: 35, incident_resolution_improvement: 25,
    })
    getProjects.mockImplementation(async (params) => filterProjects(params))
    getProject.mockImplementation(async (slug) => projects.find((project) => project.slug === slug))
    createContact.mockResolvedValue({ id: 1 })
  })

  it('loads the profile and project list from the API', async () => {
    render(<Portfolio />)
    expect(await screen.findByRole('heading', { name: /complex cloud work/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'View details for CollabDocs' })).toBeInTheDocument()
    expect(getProfile).toHaveBeenCalledOnce()
    expect(getProjects).toHaveBeenCalledWith(expect.objectContaining({ category: 'All' }))
  })

  it('searches and filters projects', async () => {
    const user = userEvent.setup()
    render(<Portfolio />)
    await screen.findByRole('button', { name: 'View details for CollabDocs' })

    await user.type(screen.getByRole('searchbox', { name: 'Search projects' }), 'DevTrack')
    expect(await screen.findByRole('button', { name: 'View details for DevTrack' })).toBeInTheDocument()
    await waitFor(() => expect(getProjects).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'DevTrack' })))
    expect(screen.queryByRole('button', { name: 'View details for CollabDocs' })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Search projects' }))
    await user.click(screen.getByRole('button', { name: 'API', exact: true }))
    expect(await screen.findByRole('button', { name: 'View details for DevTrack' })).toBeInTheDocument()
    await waitFor(() => expect(getProjects).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'API' })))
  })

  it('opens and closes accessible project details', async () => {
    const user = userEvent.setup()
    render(<Portfolio />)
    await user.click(await screen.findByRole('button', { name: 'View details for DevTrack' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view repository/i })).toHaveAttribute('href', projects[1].repo_url)
    await user.click(screen.getByRole('button', { name: 'Close project details' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits a valid contact form and shows confirmation', async () => {
    const user = userEvent.setup()
    render(<Portfolio />)
    await user.type(screen.getByLabelText('Name'), 'Alex Example')
    await user.type(screen.getByLabelText('Email'), 'alex@example.com')
    await user.type(screen.getByLabelText('What are you working on?'), 'We need help improving a cloud delivery platform.')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/message received/i)
    expect(createContact).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alex Example', email: 'alex@example.com' }))
  })

  it('shows contact API errors without losing the form input', async () => {
    createContact.mockRejectedValueOnce(new Error('Email is temporarily unavailable.'))
    render(<Portfolio />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Example' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } })
    fireEvent.change(screen.getByLabelText('What are you working on?'), { target: { value: 'We need help improving a cloud delivery platform.' } })
    fireEvent.submit(screen.getByLabelText('What are you working on?').closest('form'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email is temporarily unavailable.')
    expect(screen.getByLabelText('Name')).toHaveValue('Alex Example')
  })
})
