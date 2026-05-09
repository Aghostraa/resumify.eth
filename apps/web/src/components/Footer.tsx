export default function Footer() {
  return (
    <footer className="border-t border-white/[0.18] px-12 pt-10 pb-12 flex flex-col items-center animate-fade-up">
      <div className="flex gap-2.5 items-center mb-7 flex-wrap justify-center">
        <div className="hm-pill" style={{ borderColor: 'rgba(255,255,255,0.70)', color: '#ffffff' }}>
          Powered by ENS
        </div>
        <div className="hm-pill" style={{ borderColor: 'rgba(95,179,255,0.75)', color: '#7fc3ff' }}>
          + Sourcify
        </div>
        <div className="hm-pill" style={{ borderColor: 'rgba(95,223,128,0.75)', color: '#7fe89b' }}>
          Verified Onchain
        </div>
      </div>

      <div className="w-72 h-px mb-5 hm-divider" />

      <div
        className="font-display font-extralight text-[11px] tracking-[0.38em] uppercase text-white/85 mb-2.5"
      >
        Hallmark
      </div>
      <div className="text-[10px] font-light tracking-[0.24em] uppercase text-white/55 mb-5">
        © 2026 Hallmark · All Rights Reserved
      </div>

      <div className="flex items-center gap-2.5 mb-5">
        <a
          href="#"
          aria-label="X"
          className="w-[34px] h-[34px] border border-white/20 rounded-lg flex items-center justify-center hover:border-white/50 hover:bg-white/[0.06] transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/65 hover:fill-white transition-colors">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="w-[34px] h-[34px] border border-white/20 rounded-lg flex items-center justify-center hover:border-white/50 hover:bg-white/[0.06] transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/65 hover:fill-white transition-colors">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </a>
        <a
          href="#"
          aria-label="GitHub"
          className="w-[34px] h-[34px] border border-white/20 rounded-lg flex items-center justify-center hover:border-white/50 hover:bg-white/[0.06] transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/65 hover:fill-white transition-colors">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
      </div>

      <div className="flex items-center gap-4">
        <a className="text-[10px] font-light tracking-[0.22em] uppercase text-white/55 hover:text-white transition-colors cursor-pointer">
          Privacy
        </a>
        <span className="w-[3px] h-[3px] rounded-full bg-white/30" />
        <a className="text-[10px] font-light tracking-[0.22em] uppercase text-white/55 hover:text-white transition-colors cursor-pointer">
          Terms
        </a>
        <span className="w-[3px] h-[3px] rounded-full bg-white/30" />
        <a className="text-[10px] font-light tracking-[0.22em] uppercase text-white/55 hover:text-white transition-colors cursor-pointer">
          Docs
        </a>
        <span className="w-[3px] h-[3px] rounded-full bg-white/30" />
        <a className="text-[10px] font-light tracking-[0.22em] uppercase text-white/55 hover:text-white transition-colors cursor-pointer">
          Built at ETH Hackathon 2026
        </a>
      </div>
    </footer>
  );
}
