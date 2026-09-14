import type {
  Sexo,
  EstadoCivil,
  TipoDocumento,
  EstadoMembro,
  FormaAdmissao,
  PapelFamiliar,
  Papel,
} from "@prisma/client";

export const PAPEL: Record<Papel, string> = {
  ADMIN: "Administrador",
  PASTOR: "Pastor",
  SECRETARIA: "Secretaria",
  TESOURARIA: "Tesouraria",
  LIDER_CELULA: "Líder de célula",
};

export const SEXO: Record<Sexo, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
};

export const ESTADO_CIVIL: Record<EstadoCivil, string> = {
  SOLTEIRO: "Solteiro(a)",
  CASADO: "Casado(a)",
  DIVORCIADO: "Divorciado(a)",
  VIUVO: "Viúvo(a)",
  UNIAO_DE_FACTO: "União de facto",
};

export const TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  BI: "Bilhete de Identidade",
  PASSAPORTE: "Passaporte",
  CARTAO_RESIDENTE: "Cartão de residente",
};

export const ESTADO_MEMBRO: Record<EstadoMembro, string> = {
  VISITANTE: "Visitante",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  MEMBRO: "Membro",
  INACTIVO: "Inactivo",
  TRANSFERIDO: "Transferido",
  FALECIDO: "Falecido",
};

export const FORMA_ADMISSAO: Record<FormaAdmissao, string> = {
  BAPTISMO: "Baptismo",
  TRANSFERENCIA: "Transferência",
  RECONCILIACAO: "Reconciliação",
};

export const PAPEL_FAMILIAR: Record<PapelFamiliar, string> = {
  CHEFE: "Chefe de família",
  CONJUGE: "Cônjuge",
  FILHO: "Filho(a)",
  DEPENDENTE: "Dependente",
  OUTRO: "Outro",
};

type VarianteBadge = "default" | "success" | "warning" | "muted" | "destructive";

export const VARIANTE_ESTADO_MEMBRO: Record<EstadoMembro, VarianteBadge> = {
  MEMBRO: "success",
  VISITANTE: "default",
  EM_ACOMPANHAMENTO: "warning",
  INACTIVO: "muted",
  TRANSFERIDO: "muted",
  FALECIDO: "destructive",
};
