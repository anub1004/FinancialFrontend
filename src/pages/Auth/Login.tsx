import { useRef, useState, useEffect } from "react";
import styles from "./Login.module.css";
import Signup from "./Signup";
import { Eye, EyeOff, Mail } from "lucide-react";
import Financial from "../../assets/Financial.jpeg";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
type LoginForm = {
  email: string;
  password: string;
};
function Login() {
  let { login, authState } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signIn" | "signUp">("signIn");
  const [signUp, setSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      console.log("Auth state updated - redirecting to dashboard");
      navigate("/dashboard", { replace: true });

    }
  }, [authState.isAuthenticated, authState.user, navigate]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let data: LoginForm = {
      email: email.current?.value || "",
      password: password.current?.value || "",
    };
    if (!data.email || !data.password) {
      toast.error("Email or password should Not be Empty", {
        style: {
          minWidth: "350px",
        },
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      toast.error("Invalid email ", {
        style: {
          minWidth: "350px",
        },
      });
      return;
    }
    if (data.password.length < 6) {
      toast.error("Length of Password is Less than 6", {
        style: {
          minWidth: "350px",
        },
      });
      return;
    }
    setTimeout(async () => {
      toast.dismiss();
      try {
        await login(data.email, data.password);
        console.log("Login API call completed");
        toast.success("Login successful!", {
          style: {
            minWidth: "350px",
          },
        });
        setTimeout(() => {
          console.log("Navigating to dashboard");
          navigate("/dashboard", { replace: true });
        }, 1500);
      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Login failed";

        toast.error(message, {
          style: {
            minWidth: "350px",
          },
        });
      }
    }, 2000);
  };
  return signUp ? (
    <Signup setSignUp={setSignUp} />
  ) : (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.formPanel}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden="true">
              <span />
              <span />
            </div>
            <span className={styles.brandName}>Financial Management </span>
          </div>
          <div className={styles.contentWrap}>
            <header className={styles.header}>
              <h1>Welcome Back</h1>
              <span className={styles.subhead}>
                <h5>Access your secure financial workspace</h5>
              </span>
              <p> Please enter Your details</p>
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
                onClick={() => setSignUp(true)}
              >
                Signup
              </button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field} htmlFor="email">
                <span className={styles.fieldBody}>
                  <span className={styles.fieldLabel}>Email </span>
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
