export function summarizeRepositories(repositories) {
  const languages = new Map()

  for (const repository of repositories) {
    const name = repository.language || 'Other'
    const group = languages.get(name) || { name, repositories: 0, stars: 0, forks: 0 }
    group.repositories += 1
    group.stars += repository.stars
    group.forks += repository.forks
    languages.set(name, group)
  }

  return {
    repositories: repositories.length,
    stars: repositories.reduce((total, repository) => total + repository.stars, 0),
    forks: repositories.reduce((total, repository) => total + repository.forks, 0),
    watchers: repositories.reduce((total, repository) => total + repository.watchers, 0),
    openIssues: repositories.reduce((total, repository) => total + repository.openIssues, 0),
    sourceRepositories: repositories.filter((repository) => !repository.isFork).length,
    forkRepositories: repositories.filter((repository) => repository.isFork).length,
    archivedRepositories: repositories.filter((repository) => repository.isArchived).length,
    languages: [...languages.values()].sort((first, second) => second.repositories - first.repositories || first.name.localeCompare(second.name)),
  }
}

export function filterRepositories(repositories, { query = '', language = 'All', kind = 'all', sort = 'updated' } = {}) {
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = repositories.filter((repository) => {
    const matchesText = !normalizedQuery || `${repository.name} ${repository.description} ${repository.language}`.toLowerCase().includes(normalizedQuery)
    const matchesLanguage = language === 'All' || repository.language === language
    const matchesKind = kind === 'all'
      || (kind === 'source' && !repository.isFork)
      || (kind === 'fork' && repository.isFork)
      || (kind === 'archived' && repository.isArchived)
    return matchesText && matchesLanguage && matchesKind
  })

  return filtered.sort((first, second) => {
    if (sort === 'stars') return second.stars - first.stars || first.name.localeCompare(second.name)
    if (sort === 'forks') return second.forks - first.forks || first.name.localeCompare(second.name)
    if (sort === 'name') return first.name.localeCompare(second.name)
    return Date.parse(second.updatedAt) - Date.parse(first.updatedAt) || first.name.localeCompare(second.name)
  })
}