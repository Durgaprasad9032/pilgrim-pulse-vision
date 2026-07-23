export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 px-1 py-3 text-[11px] text-muted-foreground">
      <p>© {new Date().getFullYear()} Yatra AI · Digital Twin Platform</p>
      <div className="flex items-center gap-3 font-mono">
        <span>v1.4.2</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
        <span>Research Prototype</span>
      </div>
    </footer>
  );
}
