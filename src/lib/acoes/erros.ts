/**
 * Erro de negócio cuja mensagem é segura para mostrar ao utilizador.
 * `falhaDeErro` devolve `e.message` para estes; outros erros ficam genéricos.
 */
export class ErroDeNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDeNegocio";
  }
}
