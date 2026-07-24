export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          © {currentYear}{" "}
          <span className="font-semibold gradient-text">Aspino</span>
          . All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span>Pharmaceutical ERP v1.0</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Enterprise Edition</span>
        </div>
      </div>
    </footer>
  );
}
