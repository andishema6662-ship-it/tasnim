import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Bills } from './pages/Bills'
import { Charges } from './pages/Charges'
import { Chat } from './pages/Chat'
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

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/app/site-admin" element={<SiteAdmin />} />
          <Route path="/app" element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="units" element={<Units />} />
            <Route path="residents" element={<Residents />} />
            <Route path="charges" element={<Charges />} />
            <Route path="bills" element={<Bills />} />
            <Route path="payments" element={<Payments />} />
            <Route path="finance" element={<Finance />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="polls" element={<Polls />} />
            <Route path="news" element={<News />} />
            <Route path="chat" element={<Chat />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="suggestions" element={<Suggestions />} />
            <Route path="qarz" element={<QarzFund />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="more" element={<More />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
