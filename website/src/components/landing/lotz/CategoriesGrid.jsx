import { Link } from 'react-router-dom'
import { CATEGORIES } from './lotzData'
import { useReveal } from './useReveal'

export default function CategoriesGrid() {
  const ref = useReveal()
  return (
    <section className="lotz-section lotz-section--tint" id="categories" ref={ref}>
      <div className="lotz-container lotz-center">
        <h2 className="lotz-h2 lotz-reveal">Categories We Deal In</h2>
        <p className="lotz-body lotz-reveal">At Lotmart, we offer a wide range of categories to cater to the diverse needs of our customers.</p>
        <div className="lotz-cat-grid">
          {CATEGORIES.map((c) => (
            <article key={c.tag} className="lotz-cat lotz-reveal">
              <div className="lotz-cat__head">
                <h3>{c.tag}</h3>
                <p>{c.title}</p>
              </div>
              <div className="lotz-img-placeholder" data-asset={`category-${c.tag}`} role="img" aria-label={`${c.tag} placeholder`}>
                <span>{c.tag}</span>
              </div>
              <div className="lotz-cat__body">
                <p>{c.text}</p>
                <a className="lotz-btn lotz-btn--sm" href={c.quoteUrl} target="_blank" rel="noreferrer">Get Quote</a>
              </div>
            </article>
          ))}
        </div>
        <div className="lotz-explore lotz-reveal">
          <h3>Explore All Categories We Deal In</h3>
          <p>Explore our wide range of product categories to find the perfect inventory for your business.</p>
          <Link to="/products" className="lotz-btn">Explore All Categories</Link>
        </div>
      </div>
    </section>
  )
}
