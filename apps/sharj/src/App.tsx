import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FeatureGate } from './components/FeatureGate'
import { RoleGate } from './components/RoleGate'
import { Shell } from './components/Shell'
import { Bills } from './pages/Bills'
import { BlockTickets } from './pages/BlockTickets'
import { BuildingBroadcasts } from './pages/BuildingBroadcasts'
import { BuildingPrograms } from './pages/BuildingPrograms'
import { BuildingSiteSuggestions } from './pages/BuildingSiteSuggestions'
import { Charges } from './pages/Charges'
import { Chat } from './pages/Chat'
import { ComplexDesk } from './pages/ComplexDesk'
import { Expenses } from './pages/Expenses'
import { Finance } from './pages/Finance'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Meetings } from './pages/Meetings'
import { More } from './pages/More'
import { News } from './pages/News'
import { Notifications } from './pages/Notifications'
import { Payments } from './pages/Payments'
import { Polls } from './pages/Polls'
import { QarzFund } from './pages/QarzFund'
import { Residents } from './pages/Residents'
import { SiteAdmin } from './pages/SiteAdmin'
import { Splash } from './pages/Splash'
import { Subscription } from './pages/Subscription'
import { Suggestions } from './pages/Suggestions'
import { Units } from './pages/Units'
import { StoreProvider } from './store/StoreContext'

function Guarded({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate>
      <FeatureGate>{children}</FeatureGate>
    </RoleGate>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/app/site-admin" element={<SiteAdmin />} />
          <Route path="/app/complex" element={<ComplexDesk />} />
          <Route path="/app" element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="units" element={<Guarded><Units /></Guarded>} />
            <Route path="residents" element={<Guarded><Residents /></Guarded>} />
            <Route path="charges" element={<Guarded><Charges /></Guarded>} />
            <Route path="bills" element={<Guarded><Bills /></Guarded>} />
            <Route path="payments" element={<Guarded><Payments /></Guarded>} />
            <Route path="finance" element={<Guarded><Finance /></Guarded>} />
            <Route path="expenses" element={<Guarded><Expenses /></Guarded>} />
            <Route path="polls" element={<Guarded><Polls /></Guarded>} />
            <Route path="news" element={<Guarded><News /></Guarded>} />
            <Route path="chat" element={<Guarded><Chat /></Guarded>} />
            <Route path="meetings" element={<Guarded><Meetings /></Guarded>} />
            <Route path="suggestions" element={<Guarded><Suggestions /></Guarded>} />
            <Route path="qarz" element={<Guarded><QarzFund /></Guarded>} />
            <Route path="block-tickets" element={<Guarded><BlockTickets /></Guarded>} />
            <Route path="broadcasts" element={<Guarded><BuildingBroadcasts /></Guarded>} />
            <Route path="programs" element={<Guarded><BuildingPrograms /></Guarded>} />
            <Route
              path="site-proposals"
              element={
                <Guarded>
                  <BuildingSiteSuggestions />
                </Guarded>
              }
            />
            <Route path="notifications" element={<Notifications />} />
            <Route path="more" element={<More />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
