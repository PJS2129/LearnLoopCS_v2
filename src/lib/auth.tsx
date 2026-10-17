import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { StudentProfile } from './types'

export type AuthStatus = 'loading' | 'signedOut' | 'needsRegistration' | 'ready'

interface AuthState {
  status: AuthStatus
  user: User | null
  profile: StudentProfile | null
  isAdmin: boolean
  error: string | null
  clearError: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  register: (data: Omit<StudentProfile, 'email'>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth || !db) return
    setPersistence(auth, browserSessionPersistence).catch(() => {})
    const firestore = db

    return onAuthStateChanged(auth, async (u) => {
      // 탭/브라우저 첫 접속 시(sessionStorage에 세션 활성 플래그가 없을 때)
      // IndexedDB에 남아있던 이전 로그인 계정을 초기화하여 항상 로그인 첫 화면이 뜨도록 보장
      if (u && !sessionStorage.getItem('learnloop_auth_active')) {
        await fbSignOut(auth!)
        setUser(null)
        setProfile(null)
        setIsAdmin(false)
        setStatus('signedOut')
        return
      }

      if (!u) {
        sessionStorage.removeItem('learnloop_auth_active')
        setUser(null)
        setProfile(null)
        setIsAdmin(false)
        setStatus('signedOut')
        return
      }

      setStatus('loading')
      try {
        const email = (u.email ?? '').toLowerCase()
        // 관리자 여부: admins/{이메일} 문서 존재 여부. 보안 규칙에서도 같은 문서로 다시 확인한다.
        const [adminSnap, profileSnap] = await Promise.all([
          getDoc(doc(firestore, 'admins', email)),
          getDoc(doc(firestore, 'students', u.uid)),
        ])
        setUser(u)
        setIsAdmin(adminSnap.exists())
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as StudentProfile)
          setStatus('ready')
        } else {
          setProfile(null)
          setStatus('needsRegistration')
        }
      } catch {
        sessionStorage.removeItem('learnloop_auth_active')
        setError('내 정보를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 로그인해 주세요.')
        await fbSignOut(auth!)
      }
    })
  }, [])

  const signIn = useCallback(async () => {
    if (!auth) return
    try {
      await setPersistence(auth, browserSessionPersistence)
      sessionStorage.setItem('learnloop_auth_active', '1')
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      sessionStorage.removeItem('learnloop_auth_active')
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      setError(
        code === 'auth/popup-blocked'
          ? '팝업이 차단되었어요. 브라우저에서 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'
          : '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }, [])

  const signOut = useCallback(async () => {
    sessionStorage.removeItem('learnloop_auth_active')
    if (auth) await fbSignOut(auth)
  }, [])

  const register = useCallback(
    async (data: Omit<StudentProfile, 'email'>) => {
      if (!db || !user) return
      const email = (user.email ?? '').toLowerCase()
      await setDoc(doc(db, 'students', user.uid), {
        studentId: data.studentId,
        name: data.name,
        section: data.section,
        email,
        createdAt: serverTimestamp(),
      })
      setProfile({ ...data, email })
      setStatus('ready')
    },
    [user],
  )

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      profile,
      isAdmin,
      error,
      clearError: () => setError(null),
      signIn,
      signOut,
      register,
    }),
    [status, user, profile, isAdmin, error, signIn, signOut, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.')
  return ctx
}
