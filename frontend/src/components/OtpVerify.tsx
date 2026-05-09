import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { GlitchText } from "@/components/GlitchText";

const OTP_LENGTH = 6;

const OtpVerify = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(null);

    // Move forward
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        // Move back
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  // Handle paste across all boxes
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    // Focus last filled or last box
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("ENTER ALL 6 DIGITS");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post("/api/auth/verify-otp", { otp: code }, { withCredentials: true });
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message?.toUpperCase() || "INVALID OTP");
      // Shake & clear on error
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const filled = otp.filter(Boolean).length;
  const isComplete = filled === OTP_LENGTH;

  return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center px-4">
      <RetroContainer
        variant="terminal"
        className="w-full max-w-md border-2 border-vhs-purple/60 bg-card/90 backdrop-blur-md shadow-vhs p-8 flex flex-col items-center gap-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <GlitchText text="VERIFY" as="h1" className="text-4xl font-pixel text-vhs-cyan" />
          <p className="font-mono text-muted-foreground text-xs tracking-widest">
            ENTER THE 6-DIGIT CODE SENT TO YOUR EMAIL
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`
                w-11 h-14 text-center text-xl font-pixel
                bg-black/60 border-2 transition-all duration-150
                focus:outline-none focus:border-vhs-cyan focus:shadow-[0_0_12px_rgba(0,255,255,0.3)]
                ${digit ? "border-vhs-purple text-vhs-cyan" : "border-vhs-purple/30 text-muted-foreground"}
                ${error ? "border-vhs-pink/70 animate-pulse" : ""}
              `}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-vhs-purple/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-vhs-purple to-vhs-cyan transition-all duration-300"
            style={{ width: `${(filled / OTP_LENGTH) * 100}%` }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="font-pixel text-vhs-pink text-[10px] tracking-widest">[ERR] {error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className={`
            w-full py-3 font-pixel text-sm tracking-widest border-2 transition-all duration-200
            flex items-center justify-center gap-2
            ${isComplete && !loading
              ? "border-vhs-cyan text-vhs-cyan hover:bg-vhs-cyan/10 hover:shadow-[0_0_16px_rgba(0,255,255,0.2)]"
              : "border-vhs-purple/30 text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              VERIFYING...
            </>
          ) : (
            "CONFIRM CODE"
          )}
        </button>
      </RetroContainer>
    </div>
  );
};

export default OtpVerify;
