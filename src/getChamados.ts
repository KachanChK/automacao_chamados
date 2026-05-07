import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

type Chamado = {
    id: string;
    titulo: string;
    solicitante: string;
    data: string;
    link: string;
    descricao: string;
};

type ChamadoSemDescricao = Omit<Chamado, "descricao">;

const BASE_URL = "https://chamados.tsiconsultores.com.br";

const CHAMADOS_URL = `${BASE_URL}/admin/chamados?status=aguardando_operador&categoria=todas&chamado_id=&texto=&data_inicio=&data_fim=`;
const LIMITE_REQUISICOES_DESCRICAO = 3;

function limparTexto(texto: string): string {
    return texto.replace(/\s+/g, " ").trim();
}

function montarLinkChamado(href: string): string {
    if (href.startsWith("http")) {
        return href;
    }

    return `${BASE_URL}${href}`;
}

function criarHeadersAutenticados(): Record<string, string> {
    const cookie = process.env.CHAMADOS_COOKIES;

    if (!cookie) {
        throw new Error("CHAMADOS_COOKIES nao encontrados");
    }

    return {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    };
}

async function coletarDescricaoChamado(link: string): Promise<string> {
    const response = await axios.get(link, {
        headers: criarHeadersAutenticados()
    });

    const $ = cheerio.load(response.data);

    const tituloDescricao = $("h3")
        .filter((_, el) => limparTexto($(el).text()) === "Descri\u00e7\u00e3o do Chamado")
        .first();

    return limparTexto(
        tituloDescricao.closest(".mb-8").find(".text-gray-800.lh-lg").first().text()
    );
}

async function adicionarDescricoesAosChamados(chamados: ChamadoSemDescricao[]): Promise<Chamado[]> {
    const chamadosComDescricao: Chamado[] = new Array(chamados.length);
    let proximoIndice = 0;

    async function trabalhador(): Promise<void> {
        while (proximoIndice < chamados.length) {
            const indiceAtual = proximoIndice;
            proximoIndice += 1;

            const chamado = chamados[indiceAtual];

            if (!chamado) {
                continue;
            }

            try {
                chamadosComDescricao[indiceAtual] = {
                    ...chamado,
                    descricao: await coletarDescricaoChamado(chamado.link)
                };
            } catch (error) {
                console.error(`Erro ao coletar descricao do chamado ${chamado.id}: ${chamado.link}`);

                if (axios.isAxiosError(error)) {
                    console.error("Status:", error.response?.status);
                    console.error("Mensagem:", error.message);
                } else {
                    console.error(error);
                }

                chamadosComDescricao[indiceAtual] = {
                    ...chamado,
                    descricao: ""
                };
            }
        }
    }

    const quantidadeTrabalhadores = Math.min(LIMITE_REQUISICOES_DESCRICAO, chamados.length);
    const trabalhadores = Array.from({ length: quantidadeTrabalhadores }, () => trabalhador());

    await Promise.all(trabalhadores);

    return chamadosComDescricao;
}

async function coletarChamadosAguardandoOperador(): Promise<Chamado[]> {
    const response = await axios.get(CHAMADOS_URL, {
        headers: criarHeadersAutenticados()
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const chamados: ChamadoSemDescricao[] = [];

    $("#kt_table_chamados tbody tr").each((_, row) => {
        const colunas = $(row).find("td");

        if (colunas.length < 7) {
            return;
        }

        const id = limparTexto(colunas.eq(0).text());
        const titulo = limparTexto(colunas.eq(1).text());
        const solicitante = limparTexto(colunas.eq(2).text());
        const data = limparTexto(colunas.eq(4).text());

        const href = colunas.eq(6).find("a").attr("href");

        if (!id || !href) {
            return;
        }

        chamados.push({
            id,
            titulo,
            solicitante,
            data,
            link: montarLinkChamado(href)
        });
    });

    return adicionarDescricoesAosChamados(chamados);
}

async function main() {
    try {
        const chamados = await coletarChamadosAguardandoOperador();

        console.log(`Chamados encontrados: ${chamados.length}`);
        console.table(chamados);
    } catch (error) {
        console.error("Erro ao coletar chamados:");

        if (axios.isAxiosError(error)) {
            console.error("Status:", error.response?.status);
            console.error("Mensagem:", error.message);
        } else {
            console.error(error);
        }
    }
}

main();
