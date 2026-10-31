import { useState } from 'react'
import {
  Activity,
  Braces,
  CheckCheck,
  ClipboardList,
  CloudUpload,
  Hammer,
  PackageCheck,
  RotateCcw,
} from 'lucide-react'

const stages = [
  {
    label: 'Plan',
    title: 'Start with the outcome.',
    detail: 'Translate the customer problem into a small, measurable change before choosing the tooling.',
    icon: ClipboardList,
  },
  {
    label: 'Code',
    title: 'Make the change legible.',
    detail: 'Keep application and infrastructure changes reviewable, versioned, and easy to hand over.',
    icon: Braces,
  },
  {
    label: 'Build',
    title: 'Repeat the reliable path.',
    detail: 'Turn successful local steps into consistent, automated builds that teams can trust.',
    icon: Hammer,
  },
  {
    label: 'Test',
    title: 'Find the edge before launch.',
    detail: 'Validate behavior, security, and failure handling before a release reaches a customer environment.',
    icon: CheckCheck,
  },
  {
    label: 'Release',
    title: 'Ship a known artifact.',
    detail: 'Promote a verified version with traceable approvals, clear ownership, and a recovery plan.',
    icon: PackageCheck,
  },
  {
    label: 'Deploy',
    title: 'Bring it into the field.',
    detail: 'Work with customer and operations teams to fit the rollout to real constraints and production needs.',
    icon: CloudUpload,
  },
  {
    label: 'Operate',
    title: 'Stay close after launch.',
    detail: 'Use live signals, runbooks, and direct feedback to keep the service understandable and dependable.',
    icon: Activity,
  },
  {
    label: 'Improve',
    title: 'Close the loop.',
    detail: 'Feed lessons from production back into the platform, the pipeline, and the next customer outcome.',
    icon: RotateCcw,
  },
]

export default function DeliveryStory() {
  const [activeStage, setActiveStage] = useState(0)
  const selected = stages[activeStage]

  return (
    <section className="delivery-story" id="approach" aria-labelledby="delivery-title">
      <div className="delivery-shell">
        <div className="delivery-heading">
          <div>
            <p className="eyebrow">A DELIVERY LOOP, BUILT FOR THE FIELD</p>
            <h2 id="delivery-title">Software only counts<br /><span>when it lands.</span></h2>
          </div>
          <p>Good platform work meets the people who depend on it. Select a stage to see how I connect engineering decisions to customer outcomes.</p>
        </div>

        <div className="delivery-panel">
          <div className="delivery-readout" role="tabpanel" id="delivery-panel" aria-labelledby={`delivery-tab-${activeStage}`}>
            <p className="delivery-index">FIELD DELIVERY / {String(activeStage + 1).padStart(2, '0')} OF 08</p>
            <h3>{selected.title}</h3>
            <p className="delivery-detail">{selected.detail}</p>
            <span className="delivery-context">ENGINEERING + CUSTOMER + OPERATIONS</span>
          </div>

          <div className="delivery-art-label">
            <span className="live-mark" aria-hidden="true" /> CONTINUOUS DELIVERY
            <span>PLATFORM / APPLICATION / FIELD</span>
          </div>

          <div className="delivery-tabs" role="tablist" aria-label="DevOps delivery stages">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              return (
                <button
                  type="button"
                  role="tab"
                  id={`delivery-tab-${index}`}
                  aria-selected={activeStage === index}
                  aria-controls="delivery-panel"
                  aria-label={stage.label}
                  className={activeStage === index ? 'delivery-tab is-active' : 'delivery-tab'}
                  key={stage.label}
                  onClick={() => setActiveStage(index)}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{stage.label}</span>
                  <small>{String(index + 1).padStart(2, '0')}</small>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}