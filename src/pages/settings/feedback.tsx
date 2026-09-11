import React, { useState, useEffect } from "react";
import SettingsNav from "./SettingsNav";
import { useAuth } from "../../context/AuthContext";
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Clock,
  Lightbulb,
  Bug,
  Zap,
  Heart,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
type FeedbackCategory = "general" | "bug" | "feature" | "performance" | "appreciation";

interface FeedbackForm {
  category: FeedbackCategory;
  rating: number;
  subject: string;
  message: string;
  email: string;
  allowContact: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDayKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `feedback_submitted_${userId}_${today}`;
}

function hasSubmittedToday(userId: string) {
  return !!localStorage.getItem(getDayKey(userId));
}

function markSubmittedToday(userId: string) {
  localStorage.setItem(getDayKey(userId), new Date().toISOString());
}

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    icon: MessageSquare,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700",
    description: "General feedback or thoughts",
  },
  {
    id: "bug",
    label: "Bug Report",
    icon: Bug,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700",
    description: "Something isn't working right",
  },
  {
    id: "feature",
    label: "Feature Request",
    icon: Lightbulb,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
    description: "Suggest a new feature or improvement",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700",
    description: "Speed or performance issues",
  },
  {
    id: "appreciation",
    label: "Appreciation",
    icon: Heart,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700",
    description: "Share what you love",
  },
];

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`w-9 h-9 transition-colors ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
      <span
        className={`text-sm font-medium transition-opacity ${
          hovered || value
            ? "opacity-100 text-amber-600 dark:text-amber-400"
            : "opacity-0"
        }`}
      >
        {labels[hovered || value]}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Feedback() {
  const { authState } = useAuth();
  const userId = authState.userId ?? "anonymous";

  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [nextReset, setNextReset] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const [form, setForm] = useState<FeedbackForm>({
    category: "general",
    rating: 0,
    subject: "",
    message: "",
    email: "",
    allowContact: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackForm, string>>>({});

  // Check if user already submitted today
  useEffect(() => {
    if (hasSubmittedToday(userId)) {
      setAlreadySubmitted(true);
      // Calculate when next submission is allowed (midnight today)
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setNextReset(`${hours}h ${mins}m`);
    }
  }, [userId]);

  // Validation
  function validate(): boolean {
    const errs: Partial<Record<keyof FeedbackForm, string>> = {};
    if (form.rating === 0) errs.rating = "Please select a rating";
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (form.message.trim().length < 10)
      errs.message = "Message must be at least 10 characters";
    if (form.allowContact && !form.email.trim())
      errs.email = "Email is required if contact is allowed";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate async submission (replace with real API call when backend is ready)
    await new Promise((r) => setTimeout(r, 1200));

    markSubmittedToday(userId);
    setSubmitted(true);
    setIsSubmitting(false);
    toast.success("Feedback submitted! Thank you 🎉");
  }

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category)!;

  // ─── Already Submitted State ────────────────────────────────────────────────
  if (alreadySubmitted && !submitted) {
    return (
      <div>
        <SettingsNav />
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Feedback Already Submitted
              </h2>
              <p className="text-violet-100 text-sm">
                You've already shared your feedback today. We appreciate it!
              </p>
            </div>
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Next submission available in{" "}
                  <span className="font-bold">{nextReset}</span>
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Only one feedback submission is allowed per user per day to ensure quality. Come back tomorrow to share more thoughts!
              </p>
              <div className="pt-2">
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success State ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div>
        <SettingsNav />
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Thank You!
              </h2>
              <p className="text-emerald-100">
                Your feedback has been received and means a lot to us.
              </p>
            </div>
            <div className="p-8 space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">
                  Your Submission
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="font-medium capitalize">{form.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= form.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subject</span>
                    <span className="font-medium">{form.subject}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You can submit another feedback tomorrow. We review all submissions within 2–3 business days.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/dashboard"
                  className="flex-1 py-2.5 text-center text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/roadmap"
                  className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-sm"
                >
                  View Roadmap
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ───────────────────────────────────────────────────────────────
  return (
    <div>
      <SettingsNav />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-7">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Share Your Feedback
                </h1>
                <p className="text-violet-200 text-sm mt-0.5">
                  Help us improve FinancialApp — one submission per day per account.
                </p>
              </div>
            </div>
          </div>

          {/* 1-per-day notice */}
          <div className="flex items-center gap-2.5 px-7 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/40">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Limit: 1 feedback per day.</span>{" "}
              After submission, your next slot opens at midnight (IST).
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Feedback Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = form.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${
                      isSelected
                        ? `${cat.bg} border-current scale-[1.02] shadow-sm`
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected
                          ? cat.color
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? cat.color
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              {selectedCategory.description}
            </p>
          </div>

          {/* Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5 text-center">
              Overall Experience Rating{" "}
              <span className="text-red-500">*</span>
            </label>
            <StarRating
              value={form.rating}
              onChange={(v) => {
                setForm({ ...form, rating: v });
                if (errors.rating) setErrors({ ...errors, rating: undefined });
              }}
            />
            {errors.rating && (
              <p className="text-red-500 text-xs text-center mt-2">
                {errors.rating}
              </p>
            )}
          </div>

          {/* Subject & Message */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.subject}
                  onChange={(e) => {
                    setForm({ ...form, subject: e.target.value });
                    if (errors.subject)
                      setErrors({ ...errors, subject: undefined });
                  }}
                  className={`w-full appearance-none border rounded-xl px-4 py-3 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
                    errors.subject
                      ? "border-red-400 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <option value="">Select a subject...</option>
                  <optgroup label="General">
                    <option value="Overall App Experience">Overall App Experience</option>
                    <option value="User Interface & Design">User Interface & Design</option>
                    <option value="Navigation & Usability">Navigation & Usability</option>
                  </optgroup>
                  <optgroup label="Features">
                    <option value="Dashboard & Analytics">Dashboard & Analytics</option>
                    <option value="Transaction Management">Transaction Management</option>
                    <option value="Investment Tracking">Investment Tracking</option>
                    <option value="Budget Planning">Budget Planning</option>
                    <option value="Tax Reports">Tax Reports</option>
                    <option value="Goals Feature">Goals Feature</option>
                  </optgroup>
                  <optgroup label="Account">
                    <option value="Subscription Plans">Subscription Plans</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Security & Privacy">Security & Privacy</option>
                    <option value="Notifications">Notifications</option>
                  </optgroup>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-xs ${
                    charCount > 900
                      ? "text-red-500"
                      : charCount > 700
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}
                >
                  {charCount}/1000
                </span>
              </div>
              <textarea
                value={form.message}
                maxLength={1000}
                rows={5}
                onChange={(e) => {
                  setForm({ ...form, message: e.target.value });
                  setCharCount(e.target.value.length);
                  if (errors.message)
                    setErrors({ ...errors, message: undefined });
                }}
                placeholder={
                  form.category === "bug"
                    ? "Describe the bug: what happened, what you expected, and steps to reproduce..."
                    : form.category === "feature"
                    ? "Describe the feature you'd like to see and why it would be valuable..."
                    : "Share your thoughts, suggestions, or anything on your mind..."
                }
                className={`w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors ${
                  errors.message
                    ? "border-red-400 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>
          </div>

          {/* Contact preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Contact Preferences
            </h3>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.allowContact}
                onChange={(e) =>
                  setForm({ ...form, allowContact: e.target.checked })
                }
                className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Allow us to follow up with you
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  We may contact you to gather more details or share updates about your feedback.
                </p>
              </div>
            </label>

            {form.allowContact && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email)
                      setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="your@email.com"
                  className={`w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
                    errors.email
                      ? "border-red-400 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-2">
            By submitting, you agree that your feedback may be used to improve our product.
            We handle all data in accordance with our Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
