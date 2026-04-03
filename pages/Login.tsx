import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { repairMojibakeDeep } from '../lib/repairMojibake';
import { appRoutes } from '../lib/routes';

const Login: React.FC = () => {
  const { locale } = useLocale();
  const { login, adminCheckError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rawCopy =
    locale === 'zh'
      ? {
          title: 'ç®¡ç†å‘˜ç™»å½•',
          subtitle: 'ä½¿ç”¨æ‚¨çš„ Foodmax ç®¡ç†å‘˜è´¦æˆ·ç™»å½•',
          email: 'é‚®ç®±',
          password: 'å¯†ç ',
          emailPlaceholder: 'admin@company.com',
          passwordPlaceholder: 'è¯·è¾“å…¥å¯†ç ',
          signingIn: 'ç™»å½•ä¸­...',
          signIn: 'ç™»å½•',
          loginFailed: 'ç™»å½•å¤±è´¥'
        }
      : {
          title: 'Admin Login',
          subtitle: 'Sign in with your Foodmax admin account',
          email: 'Email',
          password: 'Password',
          emailPlaceholder: 'admin@company.com',
          passwordPlaceholder: 'Password',
          signingIn: 'Signing in...',
          signIn: 'Sign in',
          loginFailed: 'Login failed'
        };
  const copy = locale === 'zh' ? repairMojibakeDeep(rawCopy) : rawCopy;
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const redirectTarget = redirectParam && redirectParam.startsWith('/') ? redirectParam : appRoutes.admin;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (!result?.ok) {
        setErrorMsg(result?.message || copy.loginFailed);
        return;
      }

      navigate(redirectTarget, { replace: true });
    } catch (error: any) {
      setErrorMsg(error?.message || copy.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
            <p className="text-gray-600 text-sm">{copy.subtitle}</p>
          </div>
        </div>

        {(errorMsg || adminCheckError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span className="text-sm">{errorMsg || adminCheckError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{copy.email}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{copy.password}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none"
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {isLoading ? copy.signingIn : copy.signIn}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
