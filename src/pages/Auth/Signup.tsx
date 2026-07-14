import React, { useRef, useState } from "react";
import styles from "./Signup.module.css";
import { Eye, EyeOff, Mail } from "lucide-react";
import Register from "../../assets/Registerlogo.jpeg";
import { ApiConfig } from "../../config/apiconfig";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
function Signup() {
  const navigate = useNavigate();
  let username = useRef<HTMLInputElement>(null);
  let email = useRef<HTMLInputElement>(null);
  let password = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let data = {
      username: username.current?.value || "",
      email: email.current?.value || "",
      password: password.current?.value || "",
    };
    if (!data.username || !data.email || !data.password) {
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
    if (data.username.length < 3) {
      toast.error("Length of Username is Less than 3", {
        style: { minWidth: "350px" },
      });
      return;
    }
    try {
      let responseData = await axios.post(
        ApiConfig.Api_Base_Url + "api/Auth/register",
        data,
        {
          withCredentials: true,
        },
      );
      console.log("Signup successful:", responseData);
      username.current!.value = "";
      email.current!.value = "";
      password.current!.value = "";
      toast.success("Signup successful!", { style: { minWidth: "350px" } });
      // You can also redirect the user to another page or perform othe
    } catch (error: any) {
      toast.error(error.response?.data || "Sign Up failed", {
        style: {
          minWidth: "350px",
        },
      });
    }
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

          <div className={styles.contentWrap}>
            <header className={styles.header}>
              <h1>Create an account</h1>
              <p>
                Let's get you all set up so you can verify your personal account
                and begin setting up your profile.
              </p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Username</span>
                <input
                  type="text"
                  placeholder="Enter your username "
                  required
                  ref={username}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <div className={styles.inputwrapper}>
                  <input
                    type="email"
                    placeholder="Enter your Mail Address "
                    required
                    ref={email}
                  />
                  <Mail className={styles.emailIcon} />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <div className={styles.passwordGuidelines}>
                  <input
                    placeholder="Enter your Password"
                    type={showPassword ? "text" : "password"}
                    ref={password}
                  />
                  {showPassword ? (
                    <EyeOff
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
              </label>

              <button type="submit" className={styles.primaryButton}>
                Submit
              </button>
            </form>
          </div>

          <div className={styles.footerRow}>
            <p onClick={() => navigate("/login")}>Have any account? Sign In</p>
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
