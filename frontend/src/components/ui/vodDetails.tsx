import {
    Users,
} from "lucide-react";
import { useAuthStore } from "../zustand/zustand";

type VodStreamer = {
    _id: string;
    username: string;
    avatar: string;
};

type VodDetails = {
    title: string;
    description?: string | null;
    views: number;
    startedAt: string;
    endedAt: string;
    tags: string[];
    streamer: VodStreamer;
};

type PurpleAngelVodDetailsProps = {
    vod: VodDetails;
    getAvatarUrl: (avatar: string) => string;
};

export const PurpleAngelVodDetails = ({
    vod,
    getAvatarUrl,
}: PurpleAngelVodDetailsProps) => {
    const myId = String(useAuthStore((state) => state.user?._id));
    return (
        <section className="mt-8 relative isolate overflow-hidden  bg-[#07040c] text-violet-50 shadow-[0_0_45px_rgba(139,92,246,0.12)]">
            <div className="pointer-events-none absolute -left-24 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-fuchsia-700/15 blur-[80px]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-600/15" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_176px]">
                <div className="relative min-w-0 px-5 py-5 sm:px-6">
                    <div className="flex min-w-0 flex-col gap-3 border-b border-violet-500/20 pb-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.35em] text-violet-300/40">
                                archived transmission
                            </p>
                            <h1 className="truncate font-pixel text-xl leading-8 tracking-wide text-white drop-shadow-[0_0_14px_rgba(216,180,254,0.36)] sm:text-2xl">
                                {vod.title}
                            </h1>
                        </div>

                        <div className="flex max-w-full flex-wrap gap-2 lg:max-w-[300px] lg:justify-end">
                            {vod.tags.length > 0 ? (
                                vod.tags.map((tag, index) => (
                                    <span
                                        key={`${tag}-${index}`}
                                        className="border border-violet-400/30 bg-violet-500/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-violet-200 transition-colors hover:border-fuchsia-300/60 hover:bg-fuchsia-400/10 hover:text-fuchsia-100"
                                    >
                                        #{tag}
                                    </span>
                                ))
                            ) : (
                                <span className="border border-violet-400/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-violet-300/35">
                                    no-tags
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 border-l border-fuchsia-400/35 bg-black/20 px-4 py-3">
                        <p className="max-h-[72px] overflow-hidden font-mono text-sm leading-6 text-violet-100/65">
                            {vod.description?.trim() ||
                                "No archive description survived the transmission."}
                        </p>
                    </div>
                </div>

                <aside className="relative flex h-[136px] items-center overflow-hidden border-t border-violet-500/20 bg-gradient-to-b from-violet-950/55 via-[#100718] to-[#07040c] px-5 lg:h-auto lg:border-l lg:border-t-0">
                    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(192,132,252,0.18)_1px,transparent_1px)] [background-size:18px_18px]" />

                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/15" />

                    <a
                        href={vod.streamer._id == myId ? "/profile/me" : `/profile/${vod.streamer._id}`}
                        className="group relative z-10 flex w-full items-center gap-4 lg:flex-col lg:gap-3 lg:text-center"
                    >
                        <div className="relative shrink-0">
                            <div className="absolute -inset-2 rounded-full border border-fuchsia-200/20 shadow-[0_0_24px_rgba(192,132,252,0.22)] transition-all duration-500 group-hover:border-fuchsia-200/40" />
                            <img
                                src={getAvatarUrl(vod.streamer.avatar)}
                                alt={vod.streamer.username}
                                className="relative h-16 w-16 rounded-full border border-fuchsia-200/50 object-cover brightness-110 saturate-75 shadow-[0_0_24px_rgba(168,85,247,0.38)] transition-all duration-500 group-hover:scale-105 group-hover:saturate-100"
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1 text-violet-300/50 lg:justify-center">
                                <Users className="h-3 w-3" />
                                <span className="font-mono text-[9px] uppercase tracking-[0.25em]">
                                    uploader
                                </span>
                            </div>
                            <h2 className="mt-2 max-w-[140px] truncate font-pixel text-xs uppercase tracking-wider text-violet-50 transition-colors group-hover:text-fuchsia-200">
                                {vod.streamer.username}
                            </h2>
                            <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.24em] text-violet-300/45 transition-colors group-hover:text-fuchsia-100">
                                enter profile
                            </span>
                        </div>
                    </a>
                </aside>
            </div>

            <div className="relative flex h-3 items-center">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-fuchsia-400/50" />
                <span className="mx-3 h-1 w-1 rotate-45 bg-fuchsia-300 shadow-[0_0_10px_rgba(244,114,182,0.8)]" />
                <span className="h-px flex-1 bg-gradient-to-r from-fuchsia-400/50 via-violet-500/30 to-transparent" />
            </div>
        </section>
    );
};
