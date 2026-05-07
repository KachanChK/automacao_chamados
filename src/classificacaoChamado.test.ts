import { classificarChamado } from "./classificacaoChamado";

type CasoTeste = {
    nome: string;
    titulo: string;
    descricao: string;
    esperado: boolean;
};

const casos: CasoTeste[] = [
    {
        nome: "treinamentos vencidos e reprovados",
        titulo: "excluir arquivo vencido e reprovado",
        descricao:
            "Ola, por gentileza excluir treinamentos vencidos e reprovados do colaborador ALLAN DA SILVA SOUZA ID 49, Obrigada",
        esperado: true
    },
    {
        nome: "pcmso e aso vencidos",
        titulo: "DOCUMENTOS VENCIDOS",
        descricao:
            "Ola, pe\u00e7o por gentileza que seja excluido o PCMSO vencido da empresa Josafa Ferreira de Jesus e que tambem seja excluido o ASO vencido e reprovado do funcionario Josafa Ferreira de Jesus.",
        esperado: true
    },
    {
        nome: "documentacao legal e nrs vencidas",
        titulo: "Excluir Documentos vencidos",
        descricao:
            "Documentacao LEGAL - PGR - VENCIDO - EXCLUIR PCMSO - VENCIDO - EXCLUIR Cadastro de Funcionarios - Nome do Funcionario: Pablo Matheus Germann - TREINAMENTO - Excluir NRS Vencidas",
        esperado: true
    },
    {
        nome: "plano de resgate reprovado",
        titulo: "Remover documento reprovado",
        descricao:
            "Bom dia, favor remover documento reprovado: OBRA ID 4640 2.PLANO_DE_RESGATE_ESP._CONFINADO_BASE_CUIABA.pdf Plano de Resgate RESGATE ESPACO CONF.",
        esperado: true
    },
    {
        nome: "integracao sem pedido de exclusao",
        titulo: "Integracao folha pagamento",
        descricao:
            "Controle de jornada e folha de pagamento estao em andamento de fechamento de folha e estamos com dificuldade de fazer integracao.",
        esperado: false
    },
    {
        nome: "documento sem acao nem situacao",
        titulo: "Duvida sobre documento",
        descricao: "Nao consigo anexar um documento do colaborador no sistema.",
        esperado: false
    }
];

for (const caso of casos) {
    const classificacao = classificarChamado({
        titulo: caso.titulo,
        descricao: caso.descricao
    });

    if (classificacao.possivelExclusaoDocumentos !== caso.esperado) {
        throw new Error(
            `Falha no caso "${caso.nome}". Esperado ${caso.esperado}, recebido ${classificacao.possivelExclusaoDocumentos}. Motivo: ${classificacao.motivo}`
        );
    }
}

console.log(`Testes de classificacao executados: ${casos.length}`);
