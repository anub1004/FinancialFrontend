import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./Login.module.css";
import { Eye, EyeOff, Mail, Shield, Copy, ArrowLeft, Download } from "lucide-react";
import Financial from "../../assets/Financial.jpeg";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type LoginForm = {
  email: string;
  password: string;
};

type GoogleIdToken = {
  email?: string;
};

const GOOGLE_CLIENT_ID = "395266048874-6e5u5gigf5pkln4n5rkbk5i3ofqt3f8i.apps.googleusercontent.com";

function Login() {
  const { login, googleLogin, verifyTotp, loginWithRecoveryCode, requestEmailRecoveryCode, loginWithEmailVerificationCode, authState, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signIn" | "signUp">("signIn");
  const [showPassword, setShowPassword] = useState(false);

 
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpSetupRequired, setTotpSetupRequired] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [totpSessionToken, setTotpSessionToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [emailRecoveryMode, setEmailRecoveryMode] = useState(false);
  const [emailRecoveryCode, setEmailRecoveryCode] = useState("");
  const [tempAuthTokens, setTempAuthTokens] = useState<{ token: string; refreshtoken: string } | null>(null);
  const [emailTimer, setEmailTimer] = useState<number>(0);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailTimer]);

  const handleCompleteVerification = async () => {
    if (tempAuthTokens) {
      localStorage.setItem("token", tempAuthTokens.token);
      localStorage.setItem("refreshtoken", tempAuthTokens.refreshtoken);
    }
    await checkAuth();
    navigate("/dashboard", { replace: true });
  };

  const copyToClipboard = () => {
    const codesText = recoveryCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Recovery codes copied to clipboard!");
  };

  const downloadCodes = () => {
    const codesText = `Financial Management Account Recovery Codes\nGenerated at: ${new Date().toLocaleString()}\nEmail: ${tempEmail || "your-email"}\n\nKeep these codes secure. Each code can be used only once.\n\n${recoveryCodes.join("\n")}\n`;
    const blob = new Blob([codesText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-recovery-codes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded successfully!");
  };

  const handleGoogleResponse = useCallback(async (response: any) => {
    try {
      toast.loading("Signing in with Google...", { id: "google-login" });
      const responseData = await googleLogin(response.credential);

      if (responseData.totpRequired) {
        toast.dismiss("google-login");
        const googleEmail = jwtDecode<GoogleIdToken>(response.credential).email;
        if (!googleEmail) {
          throw new Error("Your Google account email could not be read. Please try again.");
        }
        setTempEmail(googleEmail);
        setTotpRequired(true);
        setTotpSetupRequired(responseData.totpSetupRequired);
        setQrCodeBase64(responseData.qrCodeBase64 || "");
        setManualEntryKey(responseData.manualEntryKey || "");
        setTotpSessionToken(responseData.totpSessionToken || "");
        toast.success("Please enter your 2FA verification code.");
      } else {
        toast.success("Login successful!", { id: "google-login" });
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed", { id: "google-login" });
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        const buttonContainer = document.getElementById("googleSignInButton");
        if (buttonContainer) {
          buttonContainer.innerHTML = "";
          google.accounts.id.renderButton(
            buttonContainer,
            { theme: "outline", size: "large", width: "100%" }
          );
        }
        return true;
      }
      return false;
    };

    if (!initializeGoogle()) {
      const interval = setInterval(() => {
        if (initializeGoogle()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse]);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !totpRequired) {
      console.log("Auth state updated - redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [authState.isAuthenticated, authState.user, navigate, totpRequired]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data: LoginForm = {
      email: email.current?.value || "",
      password: password.current?.value || "",
    };
    if (!data.email || !data.password) {
      toast.error("Email or password should Not be Empty", {
        style: { minWidth: "350px" },
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      toast.error("Invalid email ", {
        style: { minWidth: "350px" },
      });
      return;
    }
    if (data.password.length < 6) {
      toast.error("Length of Password is Less than 6", {
        style: { minWidth: "350px" },
      });
      return;
    }

    toast.loading("Validating credentials...", { id: "login-auth" });
    try {
      const responseData = await login(data.email, data.password);
      toast.dismiss("login-auth");
      console.log("Login API call completed:", responseData);

      if (responseData.totpRequired) {
        setTempEmail(data.email);
        setTotpRequired(true);
        setTotpSetupRequired(responseData.totpSetupRequired);
        setQrCodeBase64(responseData.qrCodeBase64 || "");
        setManualEntryKey(responseData.manualEntryKey || "");
        setTotpSessionToken(responseData.totpSessionToken || "");
        setTotpCode("");
      } else {
        toast.success("Login successful!");
        setTimeout(() => {
          console.log("Navigating to dashboard");
          navigate("/dashboard", { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      toast.dismiss("login-auth");
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message, {
        style: { minWidth: "350px" },
      });
    }
  };

  const requestEmailCode = async () => {
    if (!tempEmail || !/\S+@\S+\.\S+/.test(tempEmail)) { toast.error("Enter your account email first."); return; }
    try {
      await requestEmailRecoveryCode(tempEmail);
      toast.success("If the account exists, a code was sent to its email address.");
      setIsEmailSent(true);
      setEmailTimer(120);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEmailRecoverySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setVerifying(true);
      await loginWithEmailVerificationCode(tempEmail, emailRecoveryCode);
      toast.success("Email verified. Logging you in...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 800);
    } catch (err: any) { toast.error(err.message || "Email recovery login failed"); }
    finally { setVerifying(false); }
  };

  const handleTotpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);
      toast.loading("Verifying code...", { id: "totp-verify" });
      const result = await verifyTotp(tempEmail, totpCode, totpSessionToken);
      if (result.recoveryCodes?.length) {
        setTempAuthTokens({ token: result.token, refreshtoken: result.refreshtoken });
        setRecoveryCodes(result.recoveryCodes);
        return;
      }

      toast.success("Verification successful! Logging you in...", { id: "totp-verify" });
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired TOTP code", { id: "totp-verify" });
    } finally {
      setVerifying(false);
    }
  };

  const handleRecoverySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tempEmail || !recoveryPassword || !recoveryCode) return;
    try {
      setVerifying(true);
      await loginWithRecoveryCode(tempEmail, recoveryPassword, recoveryCode);
      toast.success("Recovery code accepted. Logging you in...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 800);
    } catch (err: any) {
      toast.error(err.message || "Recovery-code login failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.formPanel}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden="true">
              <span />
              <span />
            </div>
            <span className={styles.brandName}>Financial Management</span>
          </div>

          {recoveryCodes.length ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Save recovery codes</h1>
                <p>Each code can be used once if you lose your authenticator. They will not be shown again.</p>
              </header>
              <div className="w-full grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 font-mono text-sm text-slate-900">
                {recoveryCodes.map((code) => <code key={code}>{code}</code>)}
              </div>
              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={downloadCodes}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
              <button className={styles.primaryButton} type="button" onClick={handleCompleteVerification}>I saved these codes</button>
            </div>
          ) : totpRequired ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Security Verification</h1>
                <p>Enter the 6-digit code from your authenticator app.</p>
              </header>

              {totpSetupRequired && (
                <div className="w-full flex flex-col items-center bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 gap-2">
                  <span className="text-xs font-semibold text-slate-600">Scan QR to Set Up 2FA</span>
                  {qrCodeBase64 && (
                    <img src={qrCodeBase64} alt="2FA QR Code" className="w-36 h-36 border-4 border-white rounded shadow-sm" />
                  )}
                  <span className="text-[0.65rem] text-slate-500">Manual key:</span>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 w-full justify-between">
                    <code className="text-[0.65rem] font-bold break-all text-slate-900">{manualEntryKey}</code>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(manualEntryKey); toast.success("Copied!"); }} className="text-slate-400 hover:text-slate-600">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              <form className={styles.form} onSubmit={handleTotpSubmit}>
                <label className={styles.field} htmlFor="totpCode">
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Verification Code</span>
                    <input id="totpCode" type="text" maxLength={6} placeholder="000000" value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} required
                      className="tracking-[0.25em] text-center !text-lg" />
                  </span>
                </label>
                <button className={styles.primaryButton} type="submit" disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => { setTotpRequired(false); setTotpSetupRequired(false); setTotpCode(""); setQrCodeBase64(""); setManualEntryKey(""); setTotpSessionToken(""); }}
                  className="mx-auto mt-2 flex items-center justify-center gap-2 bg-transparent border-0 text-sm text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Login</span>
                </button>
                <button type="button" onClick={() => { setRecoveryMode(true); setTotpRequired(false); }}
                  className="text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer">
                  Use a recovery code
                </button>
                <button type="button" onClick={() => { setEmailRecoveryMode(true); setTotpRequired(false); setIsEmailSent(false); }}
                  className="text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer">
                  Get a code by email
                </button>
              </form>
            </div>
          ) : emailRecoveryMode ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Sign in with email</h1>
                <p>{isEmailSent ? `Enter the 8-digit verification code sent to ${tempEmail}.` : "We will send a short-lived verification code to your registered email."}</p>
              </header>
              <form className={styles.form} onSubmit={isEmailSent ? handleEmailRecoverySubmit : (e) => { e.preventDefault(); requestEmailCode(); }}>
                {!isEmailSent ? (
                  <>
                    <label className={styles.field}><span className={styles.fieldBody}><span className={styles.fieldLabel}>Email</span><input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} required /></span></label>
                    <button className={styles.primaryButton} type="submit">Send email code</button>
                  </>
                ) : (
                  <>
                    <label className={styles.field}>
                      <span className={styles.fieldBody}>
                        <span className={styles.fieldLabel}>Verification Code</span>
                        <input type="text" inputMode="numeric" maxLength={8} placeholder="00000000" value={emailRecoveryCode} 
                          onChange={(e) => setEmailRecoveryCode(e.target.value.replace(/\D/g, ""))} required
                          className="tracking-[0.25em] text-center !text-lg" />
                      </span>
                    </label>
                    <button className={styles.primaryButton} type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Verify & Login"}</button>
                    {emailTimer > 0 ? (
                      <button 
                        className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm font-semibold shadow-sm cursor-not-allowed flex items-center justify-center gap-2"
                        type="button" 
                        disabled
                      >
                        Resend in {Math.floor(emailTimer / 60)}:{String(emailTimer % 60).padStart(2, "0")}
                      </button>
                    ) : (
                      <button 
                        className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                        type="button" 
                        onClick={requestEmailCode}
                      >
                        Resend email code
                      </button>
                    )}
                   
                  </>
                )}
                <button type="button" onClick={() => { setEmailRecoveryMode(false); setIsEmailSent(false); }} className="text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer"><ArrowLeft size={13} /> Back to Login</button>
              </form>
            </div>
          ) : recoveryMode ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Recovery-code login</h1>
                <p>Use a one-time recovery code previously saved for this account.</p>
              </header>
              <form className={styles.form} onSubmit={handleRecoverySubmit}>
                <label className={styles.field}><span className={styles.fieldBody}><span className={styles.fieldLabel}>Email</span><input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} required /></span></label>
                <label className={styles.field}><span className={styles.fieldBody}><span className={styles.fieldLabel}>Password</span><input type="password" value={recoveryPassword} onChange={(e) => setRecoveryPassword(e.target.value)} required /></span></label>
                <label className={styles.field}><span className={styles.fieldBody}><span className={styles.fieldLabel}>Recovery code</span><input type="text" autoComplete="one-time-code" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())} required /></span></label>
                <button className={styles.primaryButton} type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Verify & Login"}</button>
                <button type="button" onClick={() => setRecoveryMode(false)} className="text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer"><ArrowLeft size={13} /> Back to Login</button>
              </form>
            </div>
          ) : (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <h1>Welcome Back</h1>
                <span className={styles.subhead}>
                  <h5>Access your secure financial workspace</h5>
                </span>
                <p>Please enter Your details</p>
              </header>
              <div
                className={styles.tabs}
                role="tablist"
                aria-label="Authentication mode"
              >
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "signIn" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("signIn")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "signUp" ? styles.tabActive : ""}`}
                  onClick={() => navigate("/signup")}
                >
                  Signup
                </button>
              </div>
              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field} htmlFor="email">
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Email</span>
                    <div className={styles.inputWrapper}>
                      <input id="email" type="email" ref={email} required />
                      <Mail className={styles.inputIcon} />
                    </div>
                  </span>
                </label>
                <label className={styles.field} htmlFor="password">
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Password</span>
                    <div className={styles.passwordGuidelines}>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        ref={password}
                        required
                      />
                     <span
  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600 hover:text-gray-900"
  onClick={() => setShowPassword((prev) => !prev)}
>
  {showPassword ? (
    <EyeOff size={18} strokeWidth={2} />
  ) : (
    <Eye size={18} strokeWidth={2} />
  )}
</span>
                    </div>
                  </span>
                </label>
                <button className={styles.primaryButton} type="submit">
                  Continue
                </button>
              </form>
              <div className={styles.googlelog}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                <span style={{ color: "#718096", fontSize: "14px" }}>or</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
              </div>
              <div id="googleSignInButton" style={{ width: "100%", minHeight: "44px" }}></div>
            </div>
          )}

          <p className={styles.footerText}>
            Manage your finances with ease and confidence. Sign in to access
            your personalized dashboard, track your expenses, and achieve your
            financial goals. Your secure gateway to smarter money management
            starts here.
          </p>
        </div>
        <div className={styles.heroPanel} aria-hidden="true">
          <div className={styles.heroGlow} />
          <div className={styles.heroRays} />
          <img
            src={Financial}
            alt="Financial Management"
            className={styles.heroImage}
          />
        </div>
      </section>
    </main>
  );
}

export default Login;
