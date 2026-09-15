import LandingHeader from './components/landing/LandingHeader'
import MarketplacesSection from './components/landing/MarketplacesSection'
import LandingFooter from './components/landing/LandingFooter'
import LotzHero from './components/landing/lotz/LotzHero'
import OfferingCards from './components/landing/lotz/OfferingCards'
import WhoWeAre from './components/landing/lotz/WhoWeAre'
import StatsBand from './components/landing/lotz/StatsBand'
import WhyChooseUs from './components/landing/lotz/WhyChooseUs'
import CommunityCTA from './components/landing/lotz/CommunityCTA'
import CategoriesGrid from './components/landing/lotz/CategoriesGrid'
import BrandsStrip from './components/landing/lotz/BrandsStrip'
import FaqSection from './components/landing/lotz/FaqSection'
import Testimonials from './components/landing/lotz/Testimonials'
import FinalCTA from './components/landing/lotz/FinalCTA'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="lotmart-root">
      <LandingHeader />

      <main className="lotmart-main">
        <LotzHero />
        <OfferingCards />
        <MarketplacesSection />
        <WhoWeAre />
        <StatsBand />
        <WhyChooseUs />
        <CommunityCTA />
        <CategoriesGrid />
        <BrandsStrip />
        <FaqSection />
        <Testimonials />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
