import { useState } from 'react'
import LandingHeader from './components/landing/LandingHeader'
import HeroSection from './components/landing/HeroSection'
import ValueSplit from './components/landing/ValueSplit'
import AuctionFlow from './components/landing/AuctionFlow'
import ConditionSystem from './components/landing/ConditionSystem'
import DirectModelComparison from './components/landing/DirectModelComparison'
import SellerBuyerHubs from './components/landing/SellerBuyerHubs'
import CompanyStory from './components/landing/CompanyStory'
import LandingFooter from './components/landing/LandingFooter'
import SellerAppraisalModal from './components/landing/SellerAppraisalModal'
import './LandingPage.css'

export default function LandingPage() {
  const [sellerModalOpen, setSellerModalOpen] = useState(false)

  const handleOpenSellerModal = () => setSellerModalOpen(true)
  const handleCloseSellerModal = () => setSellerModalOpen(false)

  return (
    <div className="wholelot-root">
      <LandingHeader onOpenSellerModal={handleOpenSellerModal} />

      <main className="wholelot-main">
        <HeroSection onOpenSellerModal={handleOpenSellerModal} />
        <ValueSplit onOpenSellerModal={handleOpenSellerModal} />
        <AuctionFlow />
        <ConditionSystem />
        <DirectModelComparison />
        <SellerBuyerHubs onOpenSellerModal={handleOpenSellerModal} />
        <CompanyStory />
      </main>

      <LandingFooter onOpenSellerModal={handleOpenSellerModal} />

      <SellerAppraisalModal
        isOpen={sellerModalOpen}
        onClose={handleCloseSellerModal}
      />
    </div>
  )
}
