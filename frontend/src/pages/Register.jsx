import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setApiError("Google Sign-Up Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] text-gray-300 font-sans p-4">
      <div className="bg-[#1f2937] p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">DevChat</h1>
          <p className="text-gray-400 text-sm">Create an account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-[#374151] border ${errors.name ? 'border-red-500' : 'border-transparent'} rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full bg-[#374151] border ${errors.email ? 'border-red-500' : 'border-transparent'} rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
            <div className={`relative w-full bg-[#374151] border ${errors.password ? 'border-red-500' : 'border-transparent'} rounded-md flex items-center focus-within:ring-1 focus-within:ring-blue-500`}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-transparent py-2 px-3 text-white text-sm focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pr-3 text-xs text-gray-400 hover:text-gray-200"
              >
                {showPassword ? "Show" : "Hide"}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {apiError && <p className="text-red-500 text-xs mt-1">{apiError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md font-medium text-sm transition-colors mt-6"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="mt-4 flex justify-center w-full">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError("Google Sign-Up was unsuccessful.")}
              theme="filled_black"
              shape="rectangular"
              text="signup_with"
              width="100%"
            />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
