import React, { useRef, useState, useEffect, useCallback } from "react";
import styles from "./Signup.module.css";
import { Eye, EyeOff, Mail, Shield, Copy, ArrowLeft, Download, Check } from "lucide-react";
import Register from "../../assets/Registerlogo.jpeg";
import { ApiConfig } from "../../config/apiconfig";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { verifyTotp, checkAuth, verifySignupEmailOtp, requestEmailRecoveryCode } = useAuth();
  const username = useRef<HTMLInputElement>(null);
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Plan selection state
  interface SignupPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    monthlyPrice: number;
    currency: string;
    isDefault: boolean;
    trialDays: number;
    features: { id: string; displayName: string }[];
  }
  const [showPlanStep, setShowPlanStep] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<SignupPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<{ username: string; email: string; password: string } | null>(null);

  // TOTP state
  const [totpData, setTotpData] = useState<{
    active: boolean; setupRequired: boolean; qr: string; key: string; session: string; email: string;
  }>({ active: false, setupRequired: false, qr: "", key: "", session: "", email: "" });
  const [totpCode, setTotpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [tempAuthTokens, setTempAuthTokens] = useState<{ token: string; refreshtoken: string } | null>(null);

  // Email verification state
  const [emailOtpData, setEmailOtpData] = useState<{
    active: boolean; email: string; totpSessionToken: string;
  }>({ active: false, email: "", totpSessionToken: "" });
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailTimer, setEmailTimer] = useState<number>(0);

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

  // Fetch plans for the plan selection step
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch(ApiConfig.Api_Base_Url + "api/subscription/plans");
      if (res.ok) {
        const data: SignupPlan[] = await res.json();
        setAvailablePlans(data.filter(p => p.monthlyPrice >= 0).sort((a, b) => a.monthlyPrice - b.monthlyPrice));
        // Auto-select the default plan
        const defaultPlan = data.find(p => p.isDefault);
        if (defaultPlan) setSelectedPlanId(defaultPlan.id);
      }
    } catch { /* ignore */ } finally { setLoadingPlans(false); }
  }, []);

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
    const codesText = `Financial Management Account Recovery Codes\nGenerated at: ${new Date().toLocaleString()}\nEmail: ${totpData.email || "your-email"}\n\nKeep these codes secure. Each code can be used only once.\n\n${recoveryCodes.join("\n")}\n`;
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = {
      username: username.current?.value || "",
      email: email.current?.value || "",
      password: password.current?.value || "",
    };
    if (!data.username || !data.email || !data.password) return;
    if (!/\S+@\S+\.\S+/.test(data.email)) { toast.error("Invalid email"); return; }
    if (data.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (data.username.length < 3) { toast.error("Username must be at least 3 characters"); return; }

    // Show plan selection step instead of registering immediately
    setPendingFormData(data);
    setShowPlanStep(true);
    fetchPlans();
  };

  const handlePlanSubmit = async () => {
    if (!pendingFormData) return;
    try {
      const payload = {
        ...pendingFormData,
        selectedPlanId: selectedPlanId || null,
      };
      const res = await axios.post(ApiConfig.Api_Base_Url + "api/Auth/register", payload, { withCredentials: true });
      const d = res.data;
      if (d.emailOtpRequired) {
        setEmailOtpData({ active: true, email: pendingFormData.email, totpSessionToken: d.totpSessionToken });
        setEmailTimer(120);
        setShowPlanStep(false);
        toast.success("Account created! Verify your email address to continue.");
      } else if (d.totpRequired) {
        setTotpData({ active: true, setupRequired: d.totpSetupRequired, qr: d.qrCodeBase64 || "", key: d.manualEntryKey || "", session: d.totpSessionToken || "", email: pendingFormData.email });
        setShowPlanStep(false);
        toast.success("Account created! Set up 2FA to continue.");
      } else {
        toast.success("Signup successful!");
        navigate("/login");
      }
    } catch (error: any) {
      toast.error(error.response?.data || "Sign Up failed");
    }
  };

  const handleEmailOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setVerifying(true);
      const result = await verifySignupEmailOtp(emailOtpData.email, emailOtpCode, emailOtpData.totpSessionToken);
      setTotpData({
        active: true,
        setupRequired: result.totpSetupRequired,
        qr: result.qrCodeBase64 || "",
        key: result.manualEntryKey || "",
        session: result.totpSessionToken || "",
        email: emailOtpData.email
      });
      setEmailOtpData(prev => ({ ...prev, active: false }));
      toast.success("Email verified! Now set up Two-Factor Authentication.");
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const resendEmailOtp = async () => {
    if (!emailOtpData.email) return;
    try {
      await requestEmailRecoveryCode(emailOtpData.email);
      toast.success("Verification code resent to your email.");
      setEmailTimer(120);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend email code");
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (totpCode.length !== 6) { toast.error("Enter a valid 6-digit code"); return; }
    try {
      setVerifying(true);
      const result = await verifyTotp(totpData.email, totpCode, totpData.session);
      if (result.recoveryCodes?.length) {
        setTempAuthTokens({ token: result.token, refreshtoken: result.refreshtoken });
        setRecoveryCodes(result.recoveryCodes);
        return;
      }
      toast.success("Verified! Logging you in...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally { setVerifying(false); }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.formPanel}>
          <div className={styles.topRow}>
            <div className={styles.brandPill}>
              <span className={styles.brandIcon} aria-hidden="true" />
              <span onClick={() => navigate("/login")} className={styles.back}> Financial Management</span>
            </div>
          </div>

          {recoveryCodes.length ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Save your recovery codes</h1>
                <p>Use one code only if you lose access to your authenticator. These codes will not be displayed again.</p>
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
              <button type="button" className={styles.primaryButton} onClick={handleCompleteVerification}>I saved these codes</button>
            </div>
          ) : emailOtpData.active ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Mail className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h1>Verify your email</h1>
                <p>We sent a verification code to {emailOtpData.email}.</p>
              </header>

              <form className={styles.form} onSubmit={handleEmailOtpSubmit}>
                <label className={styles.field}>
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Email Verification Code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="00000000"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                      required
                      className="tracking-[0.25em] text-center !text-lg"
                    />
                  </span>
                </label>

                <button type="submit" className={styles.primaryButton} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify Email"}
                </button>

                {emailTimer > 0 ? (
                  <button
                    className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm font-semibold shadow-sm cursor-not-allowed flex items-center justify-center gap-2"
                    type="button"
                    disabled
                  >
                    Resend code in {Math.floor(emailTimer / 60)}:{String(emailTimer % 60).padStart(2, "0")}
                  </button>
                ) : (
                  <button
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
                    type="button"
                    onClick={resendEmailOtp}
                  >
                    Resend verification code
                  </button>
                )}

                <button type="button" onClick={() => setEmailOtpData(p => ({ ...p, active: false }))}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer">
                  <ArrowLeft size={13} /> Back
                </button>
              </form>
            </div>
          ) : totpData.active ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <Shield className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h1>Two-Factor Setup</h1>
                <p>Scan the QR code with your authenticator app, then enter the 6-digit code.</p>
              </header>

              <div className="w-full flex flex-col items-center bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 gap-2">
                <span className="text-xs font-semibold text-slate-600">Scan QR Code</span>
                {totpData.qr && <img src={totpData.qr} alt="QR" className="w-36 h-36 border-4 border-white rounded shadow-sm" />}
                <span className="text-[0.65rem] text-slate-500">Manual key:</span>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 w-full justify-between">
                  <code className="text-[0.65rem] font-bold break-all text-slate-900">{totpData.key}</code>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(totpData.key); toast.success("Copied!"); }} className="text-slate-400 hover:text-slate-600">
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleTotpSubmit}>
                <label className={styles.field} htmlFor="totpCodeSignup">
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Verification Code</span>
                    <input id="totpCodeSignup" type="text" maxLength={6} placeholder="000000" value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} required
                      className="tracking-[0.25em] text-center !text-lg" />
                  </span>
                </label>
                <button type="submit" className={styles.primaryButton} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify & Complete"}
                </button>
                <button type="button" onClick={() => setTotpData(p => ({ ...p, active: false }))}
                  className="mx-auto mt-2 flex items-center justify-center gap-2 bg-transparent border-0 text-sm text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </form>
            </div>
          ) : showPlanStep ? (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <h1>Choose Your Plan</h1>
                <p>Select a plan to get started. No payment required right now.</p>
              </header>

              {loadingPlans ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {availablePlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedPlanId === plan.id
                          ? "border-indigo-500 bg-indigo-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">{plan.name}</span>
                            {plan.isDefault && (
                              <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Free</span>
                            )}
                            {plan.trialDays > 0 && (
                              <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{plan.trialDays}-day trial</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{plan.description || "Standard plan"}</p>
                          {plan.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {plan.features.slice(0, 3).map(f => (
                                <span key={f.id} className="inline-flex items-center gap-1 text-[0.6rem] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Check size={10} className="text-green-500" />
                                  {f.displayName}
                                </span>
                              ))}
                              {plan.features.length > 3 && (
                                <span className="text-[0.6rem] text-slate-400">+{plan.features.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-lg font-extrabold text-slate-900">
                            {plan.monthlyPrice === 0 ? "Free" : `${plan.currency === "INR" ? "₹" : plan.currency}${plan.monthlyPrice}`}
                          </span>
                          {plan.monthlyPrice > 0 && <span className="text-[0.6rem] text-slate-400 block">/month</span>}
                        </div>
                      </div>
                      {selectedPlanId === plan.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.primaryButton}
                onClick={handlePlanSubmit}
                disabled={loadingPlans}
                style={{ marginTop: "1rem" }}
              >
                {selectedPlanId ? "Continue with Selected Plan" : "Continue with Free Plan"}
              </button>

              <button type="button" onClick={() => setShowPlanStep(false)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mx-auto mt-1 bg-transparent border-none cursor-pointer">
                <ArrowLeft size={13} /> Back
              </button>
            </div>
          ) : (
            <div className={styles.contentWrap}>
              <header className={styles.header}>
                <h1>Create an account</h1>
                <p>Let's get you all set up so you can verify your personal account and begin setting up your profile.</p>
              </header>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Username</span>
                    <input type="text" required ref={username} />
                  </span>
                </label>
                <label className={styles.field} htmlFor="email">
                  <span className={styles.fieldBody}>
                    <span className={styles.fieldLabel}>Email</span>
                    <div className={styles.inputWrapper}>
                      <input id="email" type="email" ref={email} required />

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
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </span>
                    </div>
                  </span>
                </label>
                <button className={styles.primaryButton} type="submit">
                  Continue
                </button>
              </form>
            </div>
          )}

          <div className={styles.footerRow}>
            <p onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>Have an account? Sign In</p>
          </div>
        </div>

        <div className={styles.heroPanel} aria-hidden="true">
          <img src={Register} alt="Signup" className={styles.heroImage} />
        </div>
      </section>
    </main>
  );
}

export default Signup;
