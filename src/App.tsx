import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useAuth } from './lib/store'
import { useI18n } from './i18n'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const HrDashboard = lazy(() => import('./pages/hr/Dashboard'))
const Candidates = lazy(() => import('./pages/hr/Candidates'))
const CandidateDetail = lazy(() => import('./pages/hr/CandidateDetail'))
const Discovery = lazy(() => import('./pages/hr/Discovery'))
const Vacancies = lazy(() => import('./pages/hr/Vacancies'))
const Matching = lazy(() => import('./pages/hr/Matching'))
const Compare = lazy(() => import('./pages/hr/Compare'))
const Interview = lazy(() => import('./pages/hr/Interview'))
const Knowledge = lazy(() => import('./pages/hr/Knowledge'))
const Reports = lazy(() => import('./pages/hr/Reports'))
const GestureLab = lazy(() => import('./pages/GestureLab'))
const CandDashboard = lazy(() => import('./pages/candidate/Dashboard'))
const Profile = lazy(() => import('./pages/candidate/Profile'))
const CVUpload = lazy(() => import('./pages/candidate/CVUpload'))
const Jobs = lazy(() => import('./pages/candidate/Jobs'))
const Applications = lazy(() => import('./pages/candidate/Applications'))

function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-md border-2 border-brand border-t-transparent" role="status" aria-label="loading" />
    </div>
  )
}

function Protected({ children }: { children: JSX.Element }) {
  const user = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
function Role({ role, children }: { role: 'hr' | 'candidate'; children: JSX.Element }) {
  const user = useAuth()
  return user?.role === role ? children : <Navigate to="/app" replace />
}
function Home() {
  const user = useAuth()
  return user?.role === 'hr' ? <HrDashboard /> : <CandDashboard />
}
function NotFound() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-display text-8xl font-bold text-brand">404</p>
        <p className="mt-2 text-mute">{t('common.notFound')}</p>
        <Link to="/" className="btn btn-primary mt-6">{t('common.goHome')}</Link>
      </div>
    </div>
  )
}

export default function App() {
  const hr = (el: JSX.Element) => <Role role="hr">{el}</Role>
  const cand = (el: JSX.Element) => <Role role="candidate">{el}</Role>
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Protected><AppShell /></Protected>}>
            <Route index element={<Home />} />
            <Route path="candidates" element={hr(<Candidates />)} />
            <Route path="candidates/:id" element={hr(<CandidateDetail />)} />
            <Route path="discovery" element={hr(<Discovery />)} />
            <Route path="vacancies" element={hr(<Vacancies />)} />
            <Route path="matching" element={hr(<Matching />)} />
            <Route path="compare" element={hr(<Compare />)} />
            <Route path="interview" element={hr(<Interview />)} />
            <Route path="knowledge" element={hr(<Knowledge />)} />
            <Route path="reports" element={hr(<Reports />)} />
            <Route path="gesture" element={<GestureLab />} />
            <Route path="profile" element={cand(<Profile />)} />
            <Route path="cv" element={cand(<CVUpload />)} />
            <Route path="jobs" element={cand(<Jobs />)} />
            <Route path="applications" element={cand(<Applications />)} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
