// Esconde (desfoca) os valores em R$ do sistema. A escolha fica salva no aparelho.
// Por padrão os valores ficam ocultos; o botão de olho no menu mostra/esconde.
export const CHAVE_VALORES = 'mc-valores';
export const RE_VALOR = /R\$\s?-?\(?[\d.]+,\d{2}/;

/** Script que roda antes do React: aplica a preferência e marca os valores já na primeira pintura. */
export const SCRIPT_VALORES = `(function(){try{
var mostrar=localStorage.getItem('${CHAVE_VALORES}')==='mostrar';
document.documentElement.classList.toggle('ocultar-valores',!mostrar);
var re=${RE_VALOR.toString()};
function marcar(raiz){var w=document.createTreeWalker(raiz||document.body,NodeFilter.SHOW_TEXT),n;while((n=w.nextNode())){if(re.test(n.nodeValue)&&n.parentElement)n.parentElement.classList.add('vlr');}}
window.__marcarValores=marcar;marcar();
}catch(e){document.documentElement.classList.add('ocultar-valores');}})();`;
