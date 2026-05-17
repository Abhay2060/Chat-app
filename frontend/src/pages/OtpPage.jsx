import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LoaderIcon, MailIcon, RefreshCwIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds before user can resend

function OtpPage() {
  const navigate = useNavigate();
  const { pendingEmail, verifyOtp, resendOtp, isVerifyingOtp, isResendingOtp } = useAuthStore();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [shakeError, setShakeError] = useState(false);

  const inputRefs = useRef([]);

  // if no pending email (e.g. user navigated here directly), redirect to signup
  useEffect(() => {
    if (!pendingEmail) navigate("/signup");
  }, [pendingEmail]);

  // resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // only allow digits
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // take last char in case of paste into single box
    setDigits(newDigits);

    // auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // handle paste — spread digits across boxes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setDigits(newDigits);
    // focus last filled or next empty
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleSubmit = async () => {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) return;

    const result = await verifyOtp({ email: pendingEmail, otp });

    if (result?.attemptsLeft !== undefined) {
      setAttemptsLeft(result.attemptsLeft);
      triggerShake();
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }

    if (result?.expired || result?.locked) {
      navigate("/signup");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResendingOtp) return;
    await resendOtp(pendingEmail);
    setDigits(Array(OTP_LENGTH).fill(""));
    setAttemptsLeft(3);
    setCooldown(RESEND_COOLDOWN);
    inputRefs.current[0]?.focus();
  };

  const otpComplete = digits.every((d) => d !== "");

  // mask email for display: ali***@gmail.com
  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "";

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row h-full">

            {/* LEFT — OTP form */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">

                {/* heading */}
                <div className="text-center mb-8">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">Verify your email</h2>
                  <p className="text-slate-400 text-sm">
                    We sent a 6-digit code to
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <MailIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-medium text-sm">{maskedEmail}</span>
                  </div>
                </div>

                {/* OTP boxes */}
                <div
                  className={`flex justify-center gap-3 mb-6 ${shakeError ? "animate-shake" : ""}`}
                  style={shakeError ? { animation: "shake 0.5s ease-in-out" } : {}}
                >
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={`
                        w-11 h-14 text-center text-xl font-bold rounded-lg
                        bg-slate-800/50 border text-slate-200
                        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                        transition-all duration-150
                        ${digit ? "border-cyan-500/60" : "border-slate-700"}
                        ${shakeError ? "border-red-500/60" : ""}
                      `}
                    />
                  ))}
                </div>

                {/* attempts warning */}
                {attemptsLeft < 3 && (
                  <p className="text-center text-sm text-red-400 mb-4">
                    Wrong code — {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                  </p>
                )}

                {/* verify button */}
                <button
                  onClick={handleSubmit}
                  disabled={!otpComplete || isVerifyingOtp}
                  className="auth-btn mb-4"
                >
                  {isVerifyingOtp ? (
                    <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Verify code"
                  )}
                </button>

                {/* resend */}
                <div className="text-center">
                  {cooldown > 0 ? (
                    <p className="text-slate-500 text-sm">
                      Resend code in{" "}
                      <span className="text-cyan-400 font-medium">{cooldown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={isResendingOtp}
                      className="flex items-center gap-2 mx-auto text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${isResendingOtp ? "animate-spin" : ""}`} />
                      {isResendingOtp ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <Link to="/signup" className="auth-link text-xs">
                    Back to signup
                  </Link>
                </div>

              </div>
            </div>

            {/* RIGHT — illustration */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
              <div className="text-center">

                {/* visual OTP display */}
                <div className="mb-8 flex justify-center gap-2">
                  {["4", "8", "3", "9", "2", "0"].map((n, i) => (
                    <div
                      key={i}
                      className="w-10 h-12 rounded-lg bg-slate-800 border border-cyan-500/30
                                 flex items-center justify-center text-cyan-400 text-lg font-bold"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {n}
                    </div>
                  ))}
                </div>

                <h3 className="text-xl font-medium text-cyan-400 mb-3">
                  One step away
                </h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                  Check your inbox for the verification code. It expires in 5 minutes.
                </p>

                <div className="mt-4 flex justify-center gap-4">
                  <span className="auth-badge">Secure</span>
                  <span className="auth-badge">5 min expiry</span>
                  <span className="auth-badge">One-time</span>
                </div>
              </div>
            </div>

          </div>
        </BorderAnimatedContainer>
      </div>

      {/* shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

export default OtpPage;