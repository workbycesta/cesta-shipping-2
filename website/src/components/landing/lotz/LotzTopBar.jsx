import { CONTACT } from './lotzData'

export default function LotzTopBar() {
  return (
    <div className="lotz-topbar">
      <div className="lotz-container lotz-topbar__inner">
        <span className="lotz-topbar__item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
          {CONTACT.address}
        </span>
        <span className="lotz-topbar__right">
          <a href={`mailto:${CONTACT.email}`} className="lotz-topbar__item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7L22 7" /></svg>
            {CONTACT.email}
          </a>
          <a href={CONTACT.phoneHref} className="lotz-topbar__item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z" /></svg>
            {CONTACT.phoneDisplay}
          </a>
        </span>
      </div>
    </div>
  )
}
