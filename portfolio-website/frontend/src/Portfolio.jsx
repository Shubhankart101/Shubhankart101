import { useDeferredValue, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CodeXml,
  Download,
  Mail,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { createContact, getProfile, getProject, getProjects } from './api.js'
import DeliveryStory from './DeliveryStory.jsx'
import './Portfolio.css'

const categories = ['All', 'API', 'Automation', 'Data', 'DevOps', 'Platform', 'Product']
const profileReadmeUrl = 'https://github.com/Shubhankart101/Shubhankart101#readme'
const staticPortfolioUrl = 'https://shubhankart101.github.io/Shubhankart101/'
const fallbackProfile = {
  email: 'shubhankar.thapliyal@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shubhankarthapliyal',
  github: 'https://github.com/Shubhankart101',
  years_experience: 8,
  deployment_improvement: 35,
  incident_resolution_improvement: 25,
}

function ProjectDialog({ slug, onClose }) {
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getProject(slug, { signal: controller.signal })
      .then(setProject)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="dialog-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Close project details"><X size={20} /></button>
        {project ? <>
          <p className="eyebrow">{project.category} / SELECTED WORK</p>
          <h2 id="dialog-title">{project.title}</h2>
          <p className="dialog-summary">{project.summary}</p>
          <p className="dialog-description">{project.description}</p>
          <ul className="stack-list" aria-label="Technologies">{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
          <a className="button button-dark" href={project.repo_url} target="_blank" rel="noreferrer">View repository <ArrowUpRight size={17} /></a>
        </> : error ? <div className="dialog-error"><p role="alert" className="form-error">{error}</p><a className="text-link" href={staticPortfolioUrl} target="_blank" rel="noreferrer">Open static GitHub Pages backup <ArrowUpRight size={15} /></a><a className="text-link" href={profileReadmeUrl} target="_blank" rel="noreferrer">Open profile README backup <ArrowUpRight size={15} /></a></div> : <p className="dialog-loading" aria-live="polite">Loading project details...</p>}
      </section>
    </div>
  )
}

export default function Portfolio() {
  const [profile, setProfile] = useState(fallbackProfile)
  const [projects, setProjects] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [reloadKey, setReloadKey] = useState(0)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const [activeProject, setActiveProject] = useState(null)
  const [contactStatus, setContactStatus] = useState('idle')
  const [contactError, setContactError] = useState('')
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    const controller = new AbortController()
    getProfile({ signal: controller.signal }).then(setProfile).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getProjects({ q: deferredQuery, category, signal: controller.signal })
      .then(setProjects)
      .catch((error) => {
        if (error.name !== 'AbortError') setProjectsError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setProjectsLoading(false)
      })
    return () => controller.abort()
  }, [deferredQuery, category, reloadKey])

  async function handleContactSubmit(event) {
    event.preventDefault()
    setContactStatus('submitting')
    setContactError('')
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    try {
      await createContact(values)
      form.reset()
      setContactStatus('sent')
    } catch (error) {
      setContactError(error.message)
      setContactStatus('error')
    }
  }

  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Shubhankar Thapliyal, home">
          <span className="brand-mark">ST</span><span className="brand-name">SHUBHANKAR<br />THAPLIYAL</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#work">Work</a><a href="#approach">Approach</a><a href="#experience">Experience</a><a href="#contact">Contact</a>
        </nav>
        <a className="resume-link" href="/api/resume/" download>Resume <Download size={15} /></a>
      </header>

      <main id="main">
        <section className="hero-band" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><MapPin size={14} /> NEW DELHI, INDIA <span className="eyebrow-dot" /> OPEN TO THE RIGHT CHALLENGE</p>
            <h1 id="hero-title">Complex cloud work.<br /><span>Made dependable.</span></h1>
            <p className="hero-summary">I turn delivery friction into reliable platforms, thoughtful automation, and calm production operations.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#work">Explore selected work <ArrowDownRight size={17} /></a>
              <a className="text-link" href={`mailto:${profile.email}`}>Let's talk <ArrowUpRight size={16} /></a>
            </div>
            <div className="hero-stats" aria-label="Career highlights">
              <div><strong>{profile.years_experience}+</strong><span>years engineering</span></div>
              <div><strong>{profile.deployment_improvement}%</strong><span>faster deployments</span></div>
              <div><strong>{profile.incident_resolution_improvement}%</strong><span>faster resolution</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="photo-frame"><img src="/profile-image.jpg" alt="Portrait of Shubhankar Thapliyal" /><span className="photo-caption">PLATFORM ENGINEERING / 01</span></div>
            <div className="visual-note"><span className="note-mark">↗</span><span>Reliable by design.<br />Practical by default.</span></div>
            <span className="visual-index">28 DEG N / 77 DEG E</span>
          </div>
        </section>

        <section className="intro-strip" id="about" aria-label="Professional focus">
          <p>PLATFORM ENGINEERING</p><span aria-hidden="true">*</span><p>INFRASTRUCTURE AS CODE</p><span aria-hidden="true">*</span><p>DELIVERY THAT HOLDS UP</p>
        </section>

        <DeliveryStory />

        <section className="work-section section-wrap" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <div><p className="eyebrow">A FEW THINGS I'VE BUILT</p><h2 id="work-title">Selected work<span className="accent-period">.</span></h2></div>
            <p className="section-aside">From internal platforms to public experiments, each project starts with a real operational need.</p>
          </div>
          <div className="project-controls">
            <label className="search-control"><Search size={18} aria-hidden="true" /><span className="sr-only">Search projects</span>
              <input type="search" aria-label="Search projects" placeholder="Search projects or tools" value={query} onChange={(event) => { setProjectsLoading(true); setProjectsError(''); setQuery(event.target.value) }} />
            </label>
            <div className="category-control" role="group" aria-label="Filter projects by category">
              {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? 'category-button is-active' : 'category-button'} onClick={() => { setProjectsLoading(true); setProjectsError(''); setCategory(item) }}>{item}</button>)}
            </div>
          </div>
          <div className="project-grid" aria-live="polite">
            {projectsLoading && <p className="project-message">Loading selected work...</p>}
            {!projectsLoading && projectsError && <div className="project-message project-error" role="alert"><div><p>{projectsError}</p><a className="text-link" href={staticPortfolioUrl} target="_blank" rel="noreferrer">Static GitHub Pages backup <ArrowUpRight size={15} /></a><a className="text-link" href={profileReadmeUrl} target="_blank" rel="noreferrer">GitHub README backup <ArrowUpRight size={15} /></a></div><button className="text-link" type="button" onClick={() => { setProjectsLoading(true); setReloadKey((key) => key + 1) }}>Try again <ArrowUpRight size={15} /></button></div>}
            {!projectsLoading && !projectsError && projects.length === 0 && <p className="project-message">No projects match that search. Try another term or category.</p>}
            {!projectsLoading && !projectsError && projects.map((project, index) => (
              <article className={`project-item project-tone-${index % 4}`} key={project.slug}>
                <button className="project-card" type="button" aria-label={`View details for ${project.title}`} onClick={() => setActiveProject(project.slug)}>
                  <span className="project-topline"><span>{project.category}</span><span className="project-number">{String(index + 1).padStart(2, '0')}</span></span>
                  <span className="project-title">{project.title}<ChevronRight size={18} /></span>
                  <span className="project-summary">{project.summary}</span><span className="project-stack">{project.stack.slice(0, 3).join(' / ')}</span>
                </button>
                <a className="project-repo" href={project.repo_url} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} repository`}><CodeXml size={16} /> Repository <ArrowUpRight size={14} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="experience-band" id="experience" aria-labelledby="experience-title">
          <div className="section-wrap experience-inner">
            <div className="experience-intro"><p className="eyebrow">ENGINEERING IN THE FIELD</p><h2 id="experience-title">Built close to<br />the work.</h2>
              <p>Eight years across engineering, cloud operations, and delivery teams. I stay close to the people using the platform, from first deployment through production readiness.</p>
              <a className="text-link" href={profile.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn <ArrowUpRight size={16} /></a>
            </div>
            <ol className="career-list">
              <li><span className="career-date">2025 - NOW</span><div><h3>Technical Lead</h3><p>Wipro / Enterprise automation and hybrid cloud</p></div><span className="career-arrow">01</span></li>
              <li><span className="career-date">2021 - 2025</span><div><h3>DevOps Engineer</h3><p>AAPC / Azure, AWS and software delivery</p></div><span className="career-arrow">02</span></li>
              <li><span className="career-date">2018 - 2021</span><div><h3>Engineer, Networking</h3><p>Mindtree / Cloud operations and platform support</p></div><span className="career-arrow">03</span></li>
            </ol>
          </div>
        </section>

        <section className="contact-section section-wrap" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy"><p className="eyebrow">HAVE A GOOD PROBLEM?</p><h2 id="contact-title">Let's make it<br /><span>work better.</span></h2>
            <p>For platform engineering, cloud delivery, automation, or a conversation about the work.</p>
            <a className="contact-email" href={`mailto:${profile.email}`}><Mail size={18} /> {profile.email}</a>
            <div className="social-links"><a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><CodeXml size={19} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><BriefcaseBusiness size={19} /></a></div>
          </div>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength="100" required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label></div>
            <label>Subject <span className="optional-label">OPTIONAL</span><input name="subject" maxLength="150" /></label>
            <label>What are you working on?<textarea name="message" rows="4" minLength="20" maxLength="5000" required /></label>
            {contactError && <div className="contact-error"><p className="form-error" role="alert">{contactError}</p><a className="text-link" href={staticPortfolioUrl} target="_blank" rel="noreferrer">Open static GitHub Pages backup <ArrowUpRight size={15} /></a><a className="text-link" href={profileReadmeUrl} target="_blank" rel="noreferrer">Open profile README backup <ArrowUpRight size={15} /></a></div>}
            {contactStatus === 'sent' && <p className="form-success" role="status"><Check size={17} /> Message received. I'll be in touch.</p>}
            <button className="button button-dark form-submit" type="submit" disabled={contactStatus === 'submitting'}>{contactStatus === 'submitting' ? 'Sending...' : 'Send message'} <ArrowUpRight size={17} /></button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#top"><span className="brand-mark">ST</span><span className="brand-name">SHUBHANKAR<br />THAPLIYAL</span></a>
        <p>Cloud platforms, built to hold up.</p><div className="footer-links"><a className="back-top" href={staticPortfolioUrl} target="_blank" rel="noreferrer">Static site backup <ArrowUpRight size={15} /></a><a className="back-top" href={profileReadmeUrl} target="_blank" rel="noreferrer">README backup <ArrowUpRight size={15} /></a><a className="back-top" href="#top">Back to top <ArrowUpRight size={15} /></a></div>
      </footer>
      {activeProject && <ProjectDialog slug={activeProject} onClose={() => setActiveProject(null)} />}
    </div>
  )
}
