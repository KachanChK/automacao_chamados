export type ClassificacaoChamado = {
    possivelExclusaoDocumentos: boolean;
    pontuacao: number;
    palavrasEncontradas: string[];
    motivo: string;
};

type ChamadoClassificavel = {
    titulo: string;
    descricao: string;
};

const PALAVRAS_ACAO = [
    "excluir",
    "exclusao",
    "excluido",
    "excluida",
    "excluidos",
    "excluidas",
    "remover",
    "retirar",
    "deletar",
    "apagar"
];

const PALAVRAS_OBJETO = [
    "arquivo",
    "arquivos",
    "documento",
    "documentos",
    "documentacao",
    "treinamento",
    "treinamentos",
    "nr",
    "nrs",
    "aso",
    "pcmso",
    "pgr",
    "plano de resgate"
];

const PALAVRAS_SITUACAO = [
    "vencido",
    "vencidos",
    "vencida",
    "vencidas",
    "reprovado",
    "reprovados",
    "reprovada",
    "reprovadas",
    "invalido",
    "invalidos",
    "invalida",
    "invalidas",
    "expirado",
    "expirados",
    "expirada",
    "expiradas"
];

const PALAVRAS_CONTEXTO = [
    "colaborador",
    "funcionario",
    "funcionarios",
    "empresa",
    "obra",
    "id",
    "razao",
    "cadastro de funcionarios"
];

const COMBINACOES_FORTES = [
    "excluir vencido",
    "excluir vencidos",
    "excluir vencida",
    "excluir vencidas",
    "excluir reprovado",
    "excluir reprovados",
    "excluir reprovada",
    "excluir reprovadas",
    "remover vencido",
    "remover vencidos",
    "remover reprovado",
    "remover reprovados",
    "documentos vencidos",
    "documento vencido",
    "documento reprovado",
    "documentos reprovados",
    "arquivo vencido",
    "arquivo reprovado",
    "treinamentos vencidos",
    "treinamento reprovado",
    "nrs vencidas",
    "pcmso vencido",
    "aso vencido",
    "pgr vencido",
    "plano de resgate"
];

function normalizarParaClassificacao(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function contemTermo(textoNormalizado: string, termo: string): boolean {
    const termoNormalizado = normalizarParaClassificacao(termo);
    const textoComEspacos = ` ${textoNormalizado} `;

    return textoComEspacos.includes(` ${termoNormalizado} `);
}

function encontrarTermos(textoNormalizado: string, termos: string[]): string[] {
    return termos.filter((termo) => contemTermo(textoNormalizado, termo));
}

function juntarUnicos(...listas: string[][]): string[] {
    return [...new Set(listas.flat())];
}

export function classificarChamado(chamado: ChamadoClassificavel): ClassificacaoChamado {
    const textoNormalizado = normalizarParaClassificacao(`${chamado.titulo} ${chamado.descricao}`);

    const acoesEncontradas = encontrarTermos(textoNormalizado, PALAVRAS_ACAO);
    const objetosEncontrados = encontrarTermos(textoNormalizado, PALAVRAS_OBJETO);
    const situacoesEncontradas = encontrarTermos(textoNormalizado, PALAVRAS_SITUACAO);
    const contextosEncontrados = encontrarTermos(textoNormalizado, PALAVRAS_CONTEXTO);
    const combinacoesEncontradas = encontrarTermos(textoNormalizado, COMBINACOES_FORTES);

    const encontrouAcao = acoesEncontradas.length > 0;
    const encontrouObjeto = objetosEncontrados.length > 0;
    const encontrouSituacao = situacoesEncontradas.length > 0;
    const possivelExclusaoDocumentos = encontrouAcao && encontrouObjeto && encontrouSituacao;

    const pontuacao =
        (encontrouAcao ? 2 : 0) +
        (encontrouObjeto ? 2 : 0) +
        (encontrouSituacao ? 2 : 0) +
        (contextosEncontrados.length > 0 ? 1 : 0) +
        combinacoesEncontradas.length * 3;

    return {
        possivelExclusaoDocumentos,
        pontuacao,
        palavrasEncontradas: juntarUnicos(
            acoesEncontradas,
            objetosEncontrados,
            situacoesEncontradas,
            contextosEncontrados,
            combinacoesEncontradas
        ),
        motivo: possivelExclusaoDocumentos
            ? "Encontrou acao, objeto e situacao compativeis com exclusao de documentos."
            : "Nao encontrou todos os grupos obrigatorios: acao, objeto e situacao."
    };
}
