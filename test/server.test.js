const test=require('node:test');
const assert=require('node:assert/strict');
const {montarPrompt,montarPromptAgente,montarPromptExtracao,limparExtracaoSemantica,limparAvaliacao,pontoValido}=require('../server');

test('rubrica aceita somente os valores oficiais',()=>{
  assert.equal(pontoValido('configuracao',1.7),2);
  assert.equal(pontoValido('modelo',0.4),0);
  assert.equal(pontoValido('testagem',1),1);
});

test('prompt preserva critérios e limites de evidência',()=>{
  const p=montarPrompt({desafio:'Como podemos apoiar docentes?',evidenciasTeste:'Há duas imagens, legibilidade não confirmada.'});
  assert.match(p,/Capturas de tela não podem ser consideradas legíveis/i);
  assert.match(p,/Registro da configuração, das fontes e do acesso/i);
  assert.match(p,/não confunda o Gem/i);
});

test('resultado é normalizado e recebe assinatura',()=>{
  const pontuacoes={};for(const k of ['modelo','demanda','configuracao','testagem','analise','contribuicao','transparencia'])pontuacoes[k]={pontos:99,justificativa:'Evidência.'};
  const r=limparAvaliacao({pontuacoes,alertas:['Revise.'],feedback:'Bom trabalho.'});
  assert.equal(r.pontuacoes.configuracao.pontos,2);
  assert.equal(r.pontuacoes.modelo.pontos,1);
  assert.match(r.feedback,/Um abraço,\nProf\. Rogério$/);
});

test('análise complementar não atribui nota',()=>{
  const p=montarPromptAgente({instrucoesGem:'Atue como orientador.'});
  assert.match(p,/complementar, não atribui nota/i);
  assert.match(p,/papel, tarefas, público, contexto, limites/i);
});

test('extração semântica separa tabela, imagens e blocos finais',()=>{
  const p=montarPromptExtracao({paginas:['3.5 Base de Conhecimento\n1 PPC documento orientar respostas','6. Contribuição\nApoia docentes.']});
  assert.match(p,/reconstrua cada linha semanticamente/i);
  assert.match(p,/Capturas de tela são imagens/i);
  assert.match(p,/Separe rigorosamente/i);
  const r=limparExtracaoSemantica({fontesConhecimento:'1 | PPC | documento | orientar respostas',iaDeclaracao:'talvez'});
  assert.equal(r.fontesConhecimento,'1 | PPC | documento | orientar respostas');
  assert.equal(r.iaDeclaracao,'');
});
