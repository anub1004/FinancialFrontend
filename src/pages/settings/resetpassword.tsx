import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import { Shield, Key, Copy, AlertTriangle, Check, Loader, RefreshCw, CheckCircle } from "lucide-react";

interface QrData {
  qrCodeBase64: string;
  manualEntryKey: string;
}

const resetpassword: React.FC = () => {
  const { authState } = useAuth();
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [copied, setCopied] = useState(false);

  const formatRecoveryCode = (value: string) => {
    // Remove any non-alphanumeric characters and capitalize
    const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    // Add dashes every 4 characters, up to 12 chars
    const chunks = [];
    for (let i = 0; i < clean.length && i < 12; i += 4) {
      chunks.push(clean.substring(i, i + 4));
    }
    return chunks.join("-");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRecoveryCode(e.target.value);
    setRecoveryCode(formatted);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode || recoveryCode.replace(/-/g, "").length !== 12) {
      toast.error("Please enter a valid 12-character recovery code (e.g. ABCD-EFGH-IJKL)");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        ApiConfig.Api_Base_Url + "api/Auth/verify-recovery-code-for-qr",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ recoveryCode }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setQrData(data);
        toast.success("Recovery code verified successfully!");
      } else {
        toast.error(data.message || "Failed to verify recovery code. Please check the code and try again.");
      }
    } catch (err: any) {
      toast.error("An error occurred while verifying the recovery code.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.manualEntryKey);
    setCopied(true);
    toast.success("Manual secret key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setQrData(null);
    setRecoveryCode("");
  };

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader className="animate-spin text-violet-500 w-10 h-10" />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Unauthorized Access</h1>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold flex items-center gap-3">
          <Shield className="text-violet-500 w-8 h-8" />
          Security & Audit
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Manage your two-factor authentication (2FA) settings and recover authenticator accounts.
        </p>
      </div>

      {/* Main Feature Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Banner header gradient decoration */}
        <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
        
        <div className="p-6 sm:p-8">
          {!qrData ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-500 shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Retrieve Authenticator QR Code
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    If you have deleted or lost this account in your Authenticator app, you can enter one of your unused recovery codes to display the QR code again.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label htmlFor="recovery-code" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Enter Recovery Code
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <input
                      id="recovery-code"
                      type="text"
                      maxLength={14} // 12 characters + 2 dashes
                      placeholder="ABCD-EFGH-IJKL"
                      value={recoveryCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono tracking-widest text-center text-lg transition duration-150"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 dark:text-amber-400 w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Warning:</strong> Verifying a recovery code will consume it. It will be marked as used in our database and can no longer be used for future authentication or recovery.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !recoveryCode || recoveryCode.replace(/-/g, "").length !== 12}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition duration-150"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin w-4 h-4" />
                      Verifying Recovery Code...
                    </>
                  ) : (
                    "Verify & Retrieve QR Code"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center space-y-6 py-4 animate-fade-in">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-500 mb-3">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  QR Code Retrieved
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                  Scan this code in your Authenticator app (Google Authenticator, Authy, etc.) to register the account.
                </p>
              </div>

              {/* QR Code Graphic Frame */}
              <div className="inline-block p-4 bg-white dark:bg-white rounded-2xl shadow-md border border-gray-100 mx-auto">
                <img
                  src={qrData.qrCodeBase64}
                  alt="2FA Setup QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Manual Entry Key */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Manual Entry Key
                </label>
                <div className="flex items-center gap-2 max-w-sm mx-auto">
                  <code className="flex-1 block px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-mono font-bold text-gray-700 dark:text-gray-300 break-all select-all">
                    {qrData.manualEntryKey}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400 hover:text-violet-500 transition cursor-pointer"
                    title="Copy Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Alerts */}
             

              {/* Done/Close Button */}
              <button
                onClick={handleReset} 
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Retrieve Another Code / Clear Screen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default resetpassword;