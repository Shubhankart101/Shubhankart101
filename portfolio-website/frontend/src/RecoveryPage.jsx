import { Component } from 'react'
import { ArrowLeft, ArrowUpRight, RotateCcw } from 'lucide-react'
import './Portfolio.css'

const profileReadmeUrl = 'https://github.com/Shubhankart101/Shubhankart101#readme'
const staticPortfolioUrl = 'https://shubhankart101.github.io/Shubhankart101/'

export default function RecoveryPage({ code = '404' }) {
  const isServerError = code === '500'

  return (
    <main className="recovery-page">
      <a className="recovery-brand" href="/" aria-label="Return to Shubhankar Thapliyal portfolio">
        <span className="brand-mark">ST</span><span className="brand-name">SHUBHANKAR<br />THAPLIYAL</span>
      </a>
      <section className="recovery-content" aria-labelledby="recovery-title">
        <p className="eyebrow">{isServerError ? 'TEMPORARY INTERRUPTION' : 'ROUTE NOT FOUND'} / {code}</p>
        <h1 id="recovery-title">{isServerError ? 'The deployment hit a snag.' : 'This route drifted off course.'}</h1>
        <p>{isServerError ? 'The interactive portfolio did not finish loading. A searchable GitHub Pages backup and the profile README are still available.' : 'That address is not part of this portfolio. Continue from the main page or use either GitHub backup.'}</p>
        <div className="recovery-actions">
          <a className="button button-dark" href={staticPortfolioUrl} target="_blank" rel="noreferrer">Open static GitHub Pages backup <ArrowUpRight size={17} /></a>
          <a className="text-link" href={profileReadmeUrl} target="_blank" rel="noreferrer">Open profile README <ArrowUpRight size={15} /></a>
          {isServerError ? <button className="button recovery-secondary" type="button" onClick={() => window.location.reload()}><RotateCcw size={16} /> Retry page</button> : <a className="text-link" href="/"><ArrowLeft size={16} /> Back to portfolio</a>}
        </div>
      </section>
      <img className="recovery-art" src="/devops-methodology-loop.gif" alt="DevOps delivery cycle: plan, code, build, test, release, deploy, operate, improve" />
      <footer className="recovery-footer"><span>FIELD DELIVERY / SYSTEM STATUS</span><a href="mailto:shubhankar.thapliyal@gmail.com">Contact Shubhankar</a></footer>
    </main>
  )
}

export class PortfolioErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? <RecoveryPage code="500" /> : this.props.children
  }
}