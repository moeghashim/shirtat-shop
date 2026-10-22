"use client";

import { useState } from "react";

import type { SourceClip } from "@/lib/product/source-clips";

function LiteYouTube({ clip, label }: { clip: SourceClip; label: string }) {
  const [on, setOn] = useState(false);
  const ratio = clip.isShort ? "aspect-[9/16] w-full max-w-[280px]" : "aspect-video w-full";
  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${ratio}`}>
      {on ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&rel=0&playsinline=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOn(true)}
          aria-label={label}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${clip.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600/90 shadow-lg transition group-hover:scale-105 group-hover:bg-red-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

function LiteFacebook({ clip, label }: { clip: SourceClip; label: string }) {
  const [on, setOn] = useState(false);
  const ratio = clip.isShort ? "aspect-[9/16] w-full max-w-[280px]" : "aspect-video w-full";
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clip.url)}&show_text=false&autoplay=true&width=1280`;
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0b1220] ${ratio}`}>
      {on ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={label}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOn(true)}
          aria-label={label}
          className="group absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1b2a4a] to-[#0b1220] text-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1877f2] shadow-lg transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-sm opacity-80">Facebook</span>
        </button>
      )}
    </div>
  );
}

function Clip({ clip, label }: { clip: SourceClip; label: string }) {
  return clip.provider === "facebook" ? (
    <LiteFacebook clip={clip} label={label} />
  ) : (
    <LiteYouTube clip={clip} label={label} />
  );
}

export function SourceClipsSection({
  clips,
  heading,
  line,
  playLabel,
  dir,
}: {
  clips: SourceClip[];
  dir: "ltr" | "rtl";
  heading: string;
  line: string;
  playLabel: string;
}) {
  const shorts = clips.filter((c) => c.isShort);
  const wide = clips.filter((c) => !c.isShort);
  return (
    <section dir={dir} className="mx-auto w-full max-w-5xl border-t border-border py-12">
      <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{line}</p>
      <div className="mt-6 flex flex-col items-start gap-6 md:flex-row">
        {shorts.map((c) => (
          <div key={c.id} className="w-full md:w-[280px] md:flex-none">
            <Clip clip={c} label={playLabel} />
          </div>
        ))}
        {wide.length > 0 ? (
          <div className="flex w-full flex-1 flex-col gap-6">
            {wide.map((c) => (
              <Clip key={c.id} clip={c} label={playLabel} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
