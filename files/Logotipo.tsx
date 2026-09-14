type Variante = "cor" | "mono";
type Tamanho = "sm" | "md" | "lg";

interface LogotipoProps {
  variante?: Variante;
  tamanho?: Tamanho;
  soSimbolo?: boolean;
  className?: string;
}

const ALTURAS: Record<Tamanho, { simbolo: number; texto: number }> = {
  sm: { simbolo: 24, texto: 16 },
  md: { simbolo: 32, texto: 21 },
  lg: { simbolo: 48, texto: 32 },
};

function Simbolo({ variante, size }: { variante: Variante; size: number }) {
  const vertical = variante === "cor" ? "#EF9F27" : "currentColor";
  const horizontal = variante === "cor" ? "#BA7517" : "currentColor";

  if (variante === "mono") {
    return (
      <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
        <rect x="0" y="0" width="12" height="60" rx="3" fill="currentColor" />
        <rect x="24" y="0" width="12" height="60" rx="3" fill="currentColor" />
        <rect x="48" y="0" width="12" height="60" rx="3" fill="currentColor" />
        <rect x="1.5" y="1.5" width="21" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="37.5" y="1.5" width="21" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="13.5" y="25.5" width="33" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="1.5" y="49.5" width="21" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="37.5" y="49.5" width="21" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true">
      <rect x="0" y="0" width="12" height="60" rx="3" fill={vertical} />
      <rect x="24" y="0" width="12" height="60" rx="3" fill={vertical} />
      <rect x="48" y="0" width="12" height="60" rx="3" fill={vertical} />
      <rect x="0" y="0" width="24" height="12" rx="3" fill={horizontal} />
      <rect x="36" y="0" width="24" height="12" rx="3" fill={horizontal} />
      <rect x="12" y="24" width="36" height="12" rx="3" fill={horizontal} />
      <rect x="0" y="48" width="24" height="12" rx="3" fill={horizontal} />
      <rect x="36" y="48" width="24" height="12" rx="3" fill={horizontal} />
    </svg>
  );
}

export function Logotipo({
  variante = "cor",
  tamanho = "md",
  soSimbolo = false,
  className,
}: LogotipoProps) {
  const { simbolo, texto } = ALTURAS[tamanho];

  if (soSimbolo) {
    return (
      <span className={className} role="img" aria-label="Koinonia">
        <Simbolo variante={variante} size={simbolo} />
      </span>
    );
  }

  return (
    <span
      className={className}
      role="img"
      aria-label="Koinonia"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: simbolo * 0.4,
      }}
    >
      <Simbolo variante={variante} size={simbolo} />
      <span
        style={{
          fontFamily: "var(--fonte-marca, inherit)",
          fontSize: texto,
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: variante === "cor" ? "#BA7517" : "currentColor",
        }}
      >
        Koinonia
      </span>
    </span>
  );
}
