import { useDeferredValue, useEffect, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { getGithubRepos } from './api.js'
import { filterRepositories, summarizeRepositories } from './repositoryStats.js'

const profileReadmeUrl = 'https://github.com/Shubhankart101/Shubhankart101#readme'
const staticPortfolioUrl = 'https://shubhankart101.github.io/Shubhankart101/'
const numberFormat = new Intl.NumberFormat('en-US')

function formattedDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 'Unknown' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function RepositoryStats() {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('All')
  const [kind, setKind] = useState('all')
  const [sort, setSort] = useState('stars')
  const [reloadId, setReloadId] = useState(0)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    const controller = new AbortController()
    getGithubRepos({ signal: controller.signal })
      .then(setRepositories)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [reloadId])

  const overview = summarizeRepositories(repositories)
  const filteredRepositories = filterRepositories(repositories, {
    query: deferredQuery,
    language,
    kind,
    sort,
  })

  function retryStats() {
    setError('')
    setLoading(true)
    setReloadId((current) => current + 1)
  }

  return (
    <section className="repository-section section-wrap" id="github" aria-labelledby="repository-title">
      <div className="section-heading">
        <div><p className="eyebrow">LIVE FROM GITHUB / PUBLIC REPOSITORIES</p><h2 id="repository-title">The wider footprint<span className="accent-period">.</span></h2></div>
        <p className="section-aside">A repo-by-repo view with grouped totals by primary language, updated from GitHub.</p>
      </div>

      {loading && <p className="repository-message" role="status">Loading public repository stats...</p>}
      {!loading && error && <div className="repository-message repository-error" role="alert"><div><p>{error}</p><div className="repository-fallback-links"><a href={staticPortfolioUrl} target="_blank" rel="noreferrer">Static GitHub Pages backup <ArrowUpRight size={14} /></a><a href={profileReadmeUrl} target="_blank" rel="noreferrer">Profile README backup <ArrowUpRight size={14} /></a></div></div><button className="text-link" type="button" onClick={retryStats}>Retry <ArrowUpRight size={15} /></button></div>}

      {!loading && !error && <>
        <div className="repository-totals" aria-label="Grouped public repository totals">
          <div><strong>{numberFormat.format(overview.repositories)}</strong><span>public repositories</span></div>
          <div><strong>{numberFormat.format(overview.stars)}</strong><span>stars</span></div>
          <div><strong>{numberFormat.format(overview.forks)}</strong><span>forks</span></div>
          <div><strong>{numberFormat.format(overview.openIssues)}</strong><span>open issues</span></div>
        </div>

        <div className="repository-groups">
          <div className="language-groups">
            <div className="group-heading"><h3>By primary language</h3><span>{overview.languages.length} groups</span></div>
            {overview.languages.map((group) => (
              <button className="language-group" type="button" key={group.name} onClick={() => setLanguage(group.name)} aria-label={`Filter by ${group.name}, ${group.repositories} repositories`}>
                <span className="language-meta"><strong>{group.name}</strong><span>{group.repositories} repos · {numberFormat.format(group.stars)} stars</span></span>
                <span className="language-track"><span style={{ width: `${Math.max(3, group.repositories / Math.max(overview.repositories, 1) * 100)}%` }} /></span>
              </button>
            ))}
          </div>
          <div className="repository-types">
            <div className="group-heading"><h3>Repository mix</h3><span>public</span></div>
            <div><strong>{numberFormat.format(overview.sourceRepositories)}</strong><span>original repositories</span></div>
            <div><strong>{numberFormat.format(overview.forkRepositories)}</strong><span>forks</span></div>
            <div><strong>{numberFormat.format(overview.watchers)}</strong><span>watchers</span></div>
            <div><strong>{numberFormat.format(overview.archivedRepositories)}</strong><span>archived</span></div>
          </div>
        </div>

        <div className="repository-browser">
          <div className="repository-browser-heading"><div><p className="eyebrow">REPOSITORY INDEX</p><h3>Every public repository</h3></div><span>{filteredRepositories.length} / {overview.repositories}</span></div>
          <div className="repository-filters">
            <label className="search-control"><Search size={17} aria-hidden="true" /><span className="sr-only">Search GitHub repositories</span><input type="search" aria-label="Search GitHub repositories" placeholder="Search repositories" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label><span className="sr-only">Filter by language</span><select aria-label="Filter by language" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="All">All languages</option>{overview.languages.map((group) => <option key={group.name} value={group.name}>{group.name}</option>)}</select></label>
            <label><span className="sr-only">Filter by repository type</span><select aria-label="Filter by repository type" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">All types</option><option value="source">Original</option><option value="fork">Forks</option><option value="archived">Archived</option></select></label>
            <label><span className="sr-only">Sort repositories</span><select aria-label="Sort repositories" value={sort} onChange={(event) => setSort(event.target.value)}><option value="stars">Most stars</option><option value="forks">Most forks</option><option value="updated">Recently updated</option><option value="name">Name</option></select></label>
          </div>
          <div className="repository-table-wrap" role="region" aria-label="All public repository statistics" tabIndex="0">
            <table className="repository-table">
              <thead><tr><th scope="col">Repository</th><th scope="col">Language</th><th scope="col">Stars</th><th scope="col">Forks</th><th scope="col">Watchers</th><th scope="col">Issues</th><th scope="col">Updated</th><th scope="col">Type</th></tr></thead>
              <tbody>
                {filteredRepositories.map((repository) => (
                  <tr key={repository.name}>
                    <th scope="row"><a href={repository.url} target="_blank" rel="noreferrer">{repository.name}<ArrowUpRight size={13} /></a><span>{repository.description}</span></th>
                    <td>{repository.language}</td><td>{numberFormat.format(repository.stars)}</td><td>{numberFormat.format(repository.forks)}</td><td>{numberFormat.format(repository.watchers)}</td><td>{numberFormat.format(repository.openIssues)}</td><td>{formattedDate(repository.updatedAt)}</td><td>{repository.isFork ? 'Fork' : repository.isArchived ? 'Archived' : 'Source'}</td>
                  </tr>
                ))}
                {filteredRepositories.length === 0 && <tr><td className="repository-empty" colSpan="8">No repositories match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="repository-footnote">Stats are fetched from GitHub's public API. Public repositories only; language totals use each repository's primary language.</p>
        </div>
      </>}
    </section>
  )
}