import { Github, Globe, Linkedin, MessageCircle, Twitter } from "lucide-react"
import { RetroContainer } from "./RetroContainer"
import { useSignalStrength } from "@/hooks/signalStrength";

export const Footer = () => {
  const { latency, strength } = useSignalStrength();
  const bars = Math.round(strength / 10); // 0-10
  const signalBar = "█".repeat(bars) + "░".repeat(10 - bars);

  return (<>
    {/* Footer */}
    <footer className=" pt-8 border-t-2 border-primary ml-10 scale-95">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Terminal Prompt */}
        <RetroContainer variant="terminal" className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-6">
            {/* Terminal content */}
            <div className="font-mono text-sm space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-terminal-green">kushuvikas@gmail.com</span>
                <span className="text-muted-foreground">~</span>
                <span className="text-vhs-purple">$</span>
                <span className="text-foreground">cat README.md</span>
              </div>
              <div className="text-muted-foreground pl-4 space-y-1">
                <p>{'>'} adaptive bitrate streaming platform — built from scratch</p>
                <p>{'>'} <span className="text-terminal-green">stack:</span> node, ffmpeg, mediamtx, rabbitmq, redis, docker, nginx, Tilt, etc</p>
                <p>{'>'} <span className="text-vhs-purple">features:</span> abs transcoding, autoscaling workers, segment-level R2 uploads, superchat(rzp), etc</p>
                <p>{'>'} running on coffee & marlboro at 3am</p>
                <p className="text-vhs-cyan">
                  {'>'}{" "}

                  <a href="mailto:kushuvikas@gmail.com"
                    className="italic hover:opacity-80 underline underline-offset-2"
                  >
                    hire me before someone else does — kushuvikas@gmail.com
                  </a>
                </p>

              </div>
            </div>

            {/* Avatar */}
            <img
              src="/icon.png"
              alt="kush1jpeg"
              className="w-48 h-48 shrink-0 p-0 m-0"
            />
          </div>
        </RetroContainer>

        <RetroContainer className="space-y-3">
          <div className="font-mono text-xs space-y-5">

            <a href="https://github.com/kush1jpeg/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Github className="w-3 h-3" />
                Github:
              </span>
              <span className="text-terminal-green">kush1jpeg</span>
            </a>


            <a href="https://www.linkedin.com/in/kushagra-gupta-dystopia/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Linkedin className="w-3 h-3" />
                LinkedIn:
              </span>
              <span className="text-vhs-purple">kushagra-gupta</span>
            </a>


            <a href="https://discord.com/users/841708046799601704"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <MessageCircle className="w-3 h-3" />
                Discord:
              </span>
              <span className="text-vhs-cyan">kush1jpeg</span>
            </a>


            <a href="https://kush1jpeg.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Blogs:
              </span>
              <span className="text-vhs-pink">kush1jpeg.github.io</span>
            </a>

            <a href="https://x.com/kush1jpeg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Twitter className="w-3 h-3" />
                x.com :
              </span>
              <span className="text-vhs-pink">kush1jpeg</span>
            </a>

          </div>
        </RetroContainer>

      </div >

      <div className="text-center space-y-2 opacity-70">
        <p className="font-mono text-sm text-muted-foreground">
          iStream v1.0.0 - Analog Broadcast System
        </p>
        <div className="font-mono text-xs text-muted-foreground space-y-1">
          <p>
            [ SIGNAL STRENGTH: {signalBar} {strength}% ]
            [ LATENCY: ~{latency ?? "..."}ms ]
            [ STATUS: {strength && strength > 40 ? "OPERATIONAL" : "DEGRADED"} ]
          </p>
          <p className="text-vhs-purple text-sm">
          </p>
          "In a world of polished corporate streams, we broadcast the beautifully broken"
        </div>
      </div>
    </footer >
  </>)
}
