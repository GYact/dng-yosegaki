import Link from "next/link";
import { getGraduateData } from "@/lib/data";

export default function HomePage() {
  const { year, labName, graduates } = getGraduateData();

  return (
    <main className="grid-bg scan-lines min-h-dvh relative">
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <p className="font-mono text-sm tracking-[0.3em] text-cyan mb-4 uppercase">
            Digital Nature Group
          </p>
          <h1 className="glitch-text text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            {labName}
          </h1>
          <p className="mt-4 font-mono text-lg text-text-muted">
            卒業寄せ書き — {year}
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-cyan to-transparent" />
        </header>

        {/* Graduate Grid */}
        <section>
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-muted mb-8 uppercase">
            // Graduates
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {graduates.map((g) => (
              <Link
                key={g.slug}
                href={`/graduate/${g.slug}`}
                className="glow-card group rounded-lg p-6 block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold tracking-wide group-hover:text-cyan transition-colors">
                      {g.name}
                    </h3>
                    <p className="mt-1 font-mono text-sm text-text-muted">
                      {g.role}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-border group-hover:text-cyan transition-colors">
                    →
                  </span>
                </div>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-border to-transparent" />
                <p className="mt-3 font-mono text-xs text-text-muted">
                  寄せ書きを見る・書く
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 text-center">
          <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="mt-6 font-mono text-xs text-text-muted">
            {labName} © {year}
          </p>
        </footer>
      </div>
    </main>
  );
}
