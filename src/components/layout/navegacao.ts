import {
  LayoutDashboard,
  Users,
  Home,
  Network,
  HandHeart,
  CalendarCheck,
  Wallet,
  CalendarDays,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Recurso } from "@/lib/auth/permissoes";

export interface ItemNav {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Recurso exigido para ver o item (undefined = sempre visível). */
  recurso?: Recurso;
}

export const NAVEGACAO: ItemNav[] = [
  { href: "/", rotulo: "Painel", icone: LayoutDashboard },
  { href: "/membros", rotulo: "Membros", icone: Users, recurso: "membros" },
  { href: "/familias", rotulo: "Famílias", icone: Home, recurso: "membros" },
  { href: "/celulas", rotulo: "Células", icone: Network, recurso: "membros" },
  { href: "/ministerios", rotulo: "Departamentos", icone: HandHeart, recurso: "membros" },
  { href: "/presencas", rotulo: "Presenças", icone: CalendarCheck, recurso: "presencas" },
  { href: "/contribuicoes", rotulo: "Contribuições", icone: Wallet, recurso: "contribuicoes" },
  { href: "/eventos", rotulo: "Eventos", icone: CalendarDays, recurso: "membros" },
  { href: "/relatorios", rotulo: "Relatórios", icone: FileBarChart, recurso: "relatorios" },
  { href: "/definicoes", rotulo: "Definições", icone: Settings, recurso: "definicoes" },
];
