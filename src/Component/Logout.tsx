import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

let Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
    useEffect(() => {   
    const performLogout = async () => {
      try {
        await logout(); 
        toast.success("Logout successful!", {
          style: {
            minWidth: "350px",
            },
        });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 500);
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Logout failed";   
            toast.error(message, {
                style: {
                    minWidth: "350px",
                
                },
            });
        }   
    };
    performLogout();
    }, [logout, navigate]);
    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-xl font-semibold">Logging out...</p>
        </div>
    );
};
export default Logout;