import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Eye, EyeOff, ShieldOff, Shield, ShieldCheck, ShieldAlert, Zap } from "lucide-react";
import { RetroContainer } from "@/components/RetroContainer";
import { GlitchText } from "@/components/GlitchText";

// ─── Strength Indicator ────────────────────────────────────────────────────────

const LEVELS = [
  {
    label: "NULL",
    icon: ShieldOff,
    color: "#ff2d78",
    glow: "rgba(255,45,120,0.4)",
    blocks: 1,
    desc: "ur password is embarrassing",
  },
  {
    label: "WEAK",
    icon: ShieldOff,
    color: "#ff2d78",
    glow: "rgba(255,45,120,0.4)",
    blocks: 1,
    desc: "ur password is embarrassing",
  },
  {
    label: "FAIR",
    icon: ShieldAlert,
    color: "#facc15",
    glow: "rgba(250,204,21,0.4)",
    blocks: 3,
    desc: "getting warmer, not there yet",
  },
  {
    label: "STRONG",
    icon: Shield,
    color: "#00f5ff",
    glow: "rgba(0,245,255,0.4)",
    blocks: 4,
    desc: "respectable. almost elite.",
  },
  {
    label: "STRONG",
    icon: Shield,
    color: "#00f5ff",
    glow: "rgba(0,245,255,0.4)",
    blocks: 4,
    desc: "respectable. almost elite.",
  },
  {
    label: "ELITE",
    icon: Zap,
    color: "#b36aff",
    glow: "rgba(179,106,255,0.6)",
    blocks: 5,
    desc: "god-tier. they'll never crack this.",
  },
];

const StrengthIndicator = ({ strength }: { strength: number }) => {
  const level = LEVELS[strength];
  const Icon = level.icon;
  const totalBlocks = 5;

  return (
    <div
      className="relative border px-3 py-2.5 transition-all duration-500 overflow-hidden"
      style={{
        borderColor: `${level.color}55`,
        background: `${level.color}08`,
        boxShadow: `0 0 12px ${level.glow}, inset 0 0 20px ${level.color}05`,
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${level.color}06 2px, ${level.color}06 4px)`,
        }}
      />

      {/* Top row — icon + label + desc */}
      <div className="relative flex items-center gap-2 mb-2">
        <Icon
          className="w-3.5 h-3.5 shrink-0 transition-all duration-300"
          style={{ color: level.color, filter: `drop-shadow(0 0 4px ${level.glow})` }}
        />
        <span
          className="font-pixel text-[11px] tracking-widest transition-all duration-300"
          style={{ color: level.color, textShadow: `0 0 8px ${level.glow}` }}
        >
          {level.label}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground ml-auto">
          {level.desc}
        </span>
      </div>

      {/* Block segments */}
      <div className="relative flex gap-1">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          const active = i < level.blocks;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 transition-all duration-300"
              style={{
                background: active ? level.color : "rgba(255,255,255,0.06)",
                boxShadow: active ? `0 0 6px ${level.glow}` : "none",
                transform: active ? "scaleY(1)" : "scaleY(0.6)",
                transformOrigin: "bottom",
              }}
            />
          );
        })}
      </div>

      {/* Corner decorations */}
      <div
        className="absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors duration-300"
        style={{ borderColor: level.color }}
      />
      <div
        className="absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors duration-300"
        style={{ borderColor: level.color }}
      />
    </div>
  );
};

// ─── ChangePass ────────────────────────────────────────────────────────────────

const ChangePass = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ newPassword: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const toggleShow = (field: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!form.newPassword) return setError("PASSWORD CANNOT BE EMPTY");
    if (form.newPassword.length < 8) return setError("MINIMUM 8 CHARACTERS");
    if (form.newPassword !== form.confirmPassword) return setError("PASSWORDS DO NOT MATCH");

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        "/api/auth/forgotPass",
        { newPassword: form.newPassword, token },
        { withCredentials: true }
      );
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message?.toUpperCase() || "SOMETHING WENT WRONG");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  return (
    <div className="min-h-screen bg-background crt-container film-grain flex items-center justify-center px-4">
      <RetroContainer
        variant="terminal"
        className="w-full max-w-md border-2 border-vhs-purple/60 bg-card/90 backdrop-blur-md shadow-vhs p-8 flex flex-col gap-7"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <GlitchText text="NEW PASSWORD" as="h1" className="text-3xl font-pixel text-vhs-cyan" />
          <p className="font-mono text-muted-foreground text-xs tracking-widest">
            SET A NEW PASSWORD FOR YOUR ACCOUNT
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <PasswordField
            label="NEW PASSWORD"
            name="newPassword"
            value={form.newPassword}
            visible={show.newPassword}
            onChange={handleChange}
            onToggle={() => toggleShow("newPassword")}
          />

          {form.newPassword.length > 0 && <StrengthIndicator strength={strength} />}

          <PasswordField
            label="CONFIRM PASSWORD"
            name="confirmPassword"
            value={form.confirmPassword}
            visible={show.confirmPassword}
            onChange={handleChange}
            onToggle={() => toggleShow("confirmPassword")}
            hasError={!!form.confirmPassword && form.newPassword !== form.confirmPassword}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="font-pixel text-vhs-pink text-[10px] tracking-widest">
            [ERR] {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`
            w-full py-3 font-pixel text-sm tracking-widest border-2 transition-all duration-200
            flex items-center justify-center gap-2
            ${!loading
              ? "border-vhs-cyan text-vhs-cyan hover:bg-vhs-cyan/10 hover:shadow-[0_0_16px_rgba(0,255,255,0.2)]"
              : "border-vhs-purple/30 text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              UPDATING...
            </>
          ) : (
            "UPDATE PASSWORD"
          )}
        </button>
      </RetroContainer>
    </div>
  );
};

// ─── PasswordField ─────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  visible: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  hasError?: boolean;
}

const PasswordField = ({
  label,
  name,
  value,
  visible,
  onChange,
  onToggle,
  hasError = false,
}: PasswordFieldProps) => (
  <div className="space-y-1">
    <label className="text-[10px] text-vhs-cyan tracking-widest uppercase font-mono">
      {label}
    </label>
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className={`
          w-full bg-black/60 border-2 text-foreground text-sm px-3 py-2.5 pr-10
          font-mono focus:outline-none transition-colors
          ${hasError
            ? "border-vhs-pink/70 focus:border-vhs-pink"
            : "border-vhs-purple/50 focus:border-vhs-cyan focus:shadow-[0_0_12px_rgba(0,255,255,0.15)]"
          }
        `}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vhs-cyan transition-colors"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

export default ChangePass;
