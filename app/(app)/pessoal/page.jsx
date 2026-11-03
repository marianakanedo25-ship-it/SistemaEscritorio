import { q } from '@/lib/db';
import { mesAtual, ymValido } from '@/lib/format';
import { resumoDosMeses, saldoQueChega } from '@/lib/pessoal-dados';
import MonthNav from '@/components/MonthNav';
import PessoalMes from './PessoalMes';
import ImportarPlanilha from './ImportarPlanilha';
import { salvarMesPessoal, comecarMesPessoal, importarPlanilhaPessoal } from './actions';

export const metadata = { title: 'Financeiro Pessoal' };

export default async function PessoalPage({ searchParams }) {
  const sp = await searchParams;
  const m = ymValido(sp?.m) ? sp.m : mesAtual();
  const [dados, linhas, cfg] = await Promise.all([
    resumoDosMeses(),
    q('SELECT id, tipo, descricao, valor, feito, parcela, data, obs FROM pf_lancamentos WHERE mes = $1 ORDER BY ordem, id', [m]),
    q('SELECT saldo_inicial FROM pf_meses WHERE mes = $1', [m]),
  ]);
  const vazioGeral = !dados.meses.length;
  const anteriores = dados.meses.filter((x) => x < m && dados.resumo[x].temLinhas);
  const versao = `${m}:${linhas.length}:${Math.max(0, ...linhas.map((l) => l.id))}`;
  const manual = cfg[0]?.saldo_inicial;

  return (
    <>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <MonthNav ym={m} base="/pessoal" />
        <ImportarPlanilha action={importarPlanilhaPessoal} classe="btn sm" texto="Importar a 000_PLANILHA (.xlsx)" />
      </div>
      {vazioGeral && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Para trazer o que já está na sua <strong>000_PLANILHA</strong>: no Google Drive, abra a planilha → Arquivo → Fazer download → Microsoft Excel (.xlsx), e use o botão “Importar a 000_PLANILHA”. Ou comece a lançar direto abaixo.
        </div>
      )}
      <PessoalMes
        key={versao}
        mes={m}
        inicial={linhas.map(({ id, ...l }) => ({ ...l, valor: Number(l.valor) }))}
        saldoAuto={saldoQueChega(dados, m)}
        saldoManualInicial={manual == null ? '' : String(manual)}
        podeComecar={!linhas.length && anteriores.length > 0}
        mesAnterior={anteriores[anteriores.length - 1] || null}
        salvar={salvarMesPessoal}
        comecar={comecarMesPessoal}
      />
    </>
  );
}
