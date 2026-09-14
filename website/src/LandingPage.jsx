import LandingHeader from './components/landing/LandingHeader'
import HeroSection from './components/landing/HeroSection'
import MarketplacesSection from './components/landing/MarketplacesSection'
import AuctionFlow from './components/landing/AuctionFlow'
import ConditionSystem from './components/landing/ConditionSystem'
import DirectModelComparison from './components/landing/DirectModelComparison'
import CompanyStory from './components/landing/CompanyStory'
import LandingFooter from './components/landing/LandingFooter'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="wholelot-root">
      <LandingHeader />

      <main className="wholelot-main">
        <HeroSection />
        <MarketplacesSection />
        <AuctionFlow />
        <ConditionSystem />
        <DirectModelComparison />
        <CompanyStory />
      </main>

      <LandingFooter />
    </div>
  )
}
