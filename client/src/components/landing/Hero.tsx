import { hero } from '../../content/landing'
import { Stagger, StaggerItem } from '../ui/landing-motion'

function Arrow() {
  return (
    <svg className="arw" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Hero() {
  return (
    <>
      <Stagger onLoad>
        <StaggerItem>
          <h1>{hero.heading.map((line) => <span className="ln" key={line}><span className="ln-i">{line}</span></span>)}</h1>
        </StaggerItem>
        <StaggerItem>
          <p className="sub">{hero.subLines.map((line, index) => <span key={line}>{line}{index < hero.subLines.length - 1 ? <br /> : null}</span>)}</p>
        </StaggerItem>
        <StaggerItem className="ctas">
          {hero.actions.map((action, index) => (
            <a className={`btn btn-lg ${index === 0 ? 'btn-primary' : 'btn-ghost'}`} href={action.href} key={action.href}>
              {action.label} <Arrow />
            </a>
          ))}
        </StaggerItem>
      </Stagger>
    </>
  )
}
