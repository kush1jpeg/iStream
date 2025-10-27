import { useEffect, useState } from 'react';
import InteractiveCharacter from "@/components/ui/poor-ghost";
import { Eye, EyeOff, Zap } from 'lucide-react';
import styles from '../auth.module.css';
import { AsciiLogo } from '@/components/AsciiLogo';
import { Pinwheel } from 'ldrs/react'
import 'ldrs/react/Pinwheel.css'


export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  };
useEffect(() => {
  const timer = setTimeout(() => {
    setLoaded(true);
    }, 500); 

  return () => clearTimeout(timer); // cleanup if component unmounts
}, []);

  const handleOAuthLogin = async (provider: 'google' | 'twitch') => {
    setOauthLoading(provider);
    setError('');
  };

  return (<>
    <div className={styles['auth-container']} data-theme="dark">
      <div className={styles['scanlines']}></div>
      <div className={styles['crt-flicker']}></div>
      <div className={styles['auth-grid']}>
        <div className={styles['hero-section top-2']}>
          <AsciiLogo className='rounded-lg bg-black px-6  z-10  text-center scale-125 ' />
          <div className={styles['logo-container']}>
            <div className={styles['logo-glow']}></div>
          </div>

          <div   className={`absolute right-16 mt-3 transition-opacity duration-1000 ${
          loaded ? 'opacity-100' : 'opacity-0'}`}>
          <InteractiveCharacter />
          </div>
        </div>

        <div className={styles['auth-panel']}>
          <div className={styles['terminal-bar']}>
            <span className={styles['terminal-dot']}></span>
            <span className={styles['terminal-dot']}></span>
            <span className={styles['terminal-dot']}></span>
          </div>

          <div className={styles['panel-glow']}></div>
          <div className={styles['panel-content']}>
            <div className={styles['panel-header']}>
              <div className={styles['panel-tabs']}>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`${styles.tab} ${isLogin ? styles.active : ''}`}
                >
                  LOGIN
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`${styles.tab} ${!isLogin ? styles.active : ''}`}
                >
                  SIGN UP
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles['auth-form']}>
              {error && (
                <div className={styles['error-message']}>
                  <span className={styles['error-icon']}>⚠</span>
                  {error}
                </div>
              )}

              <div className={styles['input-group']}>
                <label className={styles['input-label']}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles['neon-input']}
                  placeholder="user@cyberspace.net"
                  required
                />
                <div className={styles['input-underline']}></div>
              </div>

              <div className={styles['input-group']}>
                <label className={styles['input-label']}>PASSWORD</label>
                <div className={styles['password-wrapper']}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles['neon-input']}
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles['password-toggle']}
                  >
                    {showPassword ? (
                      <EyeOff className={styles['icon']} />
                    ) : (
                      <Eye className={styles['icon']} />
                    )}
                  </button>
                </div>
                <div className={styles['input-underline']}></div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles['submit-button']}
              >
                <span className={styles['button-bg']}></span>
                <span className={styles['button-text']}>
                  {loading ? (
                    <>
                      <span className={styles['loader']}></span>
                      CONNECTING...
                    </>
                  ) : (
                    <>
                      <Zap className={styles.buttonIcon} />
                      {isLogin ? 'STREAM➲' : 'INIT➲'}
                    </>
                  )}
                </span>
                <span className={styles['button-glow']}></span>
              </button>
            </form>

            <div className={styles['oauth-section']}>
              <div className={styles['oauth-divider']}>
                <span className={styles['divider-line']}></span>
                <span className={styles['divider-text']}>OR CONNECT VIA</span>
                <span className={styles['divider-line']}></span>
              </div>

              <div className={styles['oauth-buttons']}>
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading !== null}
                  className={`${styles['oauth-button']} ${styles['google']}`}
                >
                  <span className={styles['oauth-button-bg']}></span>
                  <span className={styles['oauth-button-content']}>
                    {oauthLoading === 'google' ? (
                      <>
                        <span className={styles['loader-small']}></span>
                        CONNECTING...
                      </>
                    ) : (
                      <>
                        <svg className={styles['oauth-icon']} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        GOOGLE
                      </>
                    )}
                  </span>
                  <span className={styles['oauth-button-glow']}></span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('twitch')}
                  disabled={oauthLoading !== null}
                  className={`${styles['oauth-button']} ${styles['twitch']}`}
                >
                  <span className={styles['oauth-button-bg']}></span>
                  <span className={styles['oauth-button-content']}>
                    {oauthLoading === 'twitch' ? (
                      <>
                        <span className={styles['loader-small']}></span>
                        CONNECTING...
                      </>
                    ) : (
                      <>
                        <svg className={styles['oauth-icon']} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                        </svg>
                        TWITCH
                      </>
                    )}
                  </span>
                  <span className={styles['oauth-button-glow']}></span>
                </button>
              </div>
            </div>

            <div className={styles['panel-footer']}>
              <div className={styles['pixel-divider']}></div>
              <p className={styles['footer-text']}>
                {isLogin ? "New user?" : "Already connected?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className={styles['footer-link']}
                >
                  {isLogin ? 'Create account' : 'Login here'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles['background-grid']}></div>
      <div className={styles['floating-pixels']}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={styles['pixel']}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  </>);
}

