require('dotenv').config();
const express = require('express');
const path = require('path');
const {RUBRICA, ORDEM} = require('./rubrica');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const APP_USERNAME = process.env.APP_USERNAME || 'professor';
const APP_PASSWORD = process.env.APP_PASSWORD || '';

if(process.env.NODE_ENV === 'production' && !APP_PASSWORD){
  throw new Error('APP_PASSWORD é obrigatória em produção.');
}

app.use((req,res,next)=>{
  if(!APP_PASSWORD || req.path === '/api/health' || !req.path.startsWith('/api/')) return next();
  const header = req.headers.authorization || '';
  let usuario='', senha='';
  try{ [usuario,senha] = Buffer.from(header.replace(/^Basic\s+/i,''),'base64').toString('utf8').split(':'); }catch{}
  if(usuario === APP_USERNAME && senha === APP_PASSWORD) return next();
  res.set('WWW-Authenticate','Basic realm="Avaliador P5 Agente de IA", charset="UTF-8"');
  return res.status(401).send('Autenticação necessária.');
});

app.use(express.json({limit:'4mb'}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/api/health',(_req,res)=>res.json({ok:true,openaiConfigurada:Boolean(OPENAI_API_KEY)}));

function precisaChave(res){
  if(OPENAI_API_KEY) return false;
  res.status(401).json({erro:'OPENAI_API_KEY não configurada no servidor.'});
  return true;
}

app.get('/api/turmas',async(_req,res)=>{try{res.json(await db.listarTurmas());}catch(e){res.status(500).json({erro:e.message});}});
app.post('/api/turmas',async(req,res)=>{try{res.status(201).json(await db.criarTurma(req.body?.nome));}catch(e){res.status(400).json({erro:e.message});}});
app.patch('/api/turmas/:id',async(req,res)=>{try{res.json(await db.renomearTurma(req.params.id,req.body?.nome));}catch(e){res.status(400).json({erro:e.message});}});
app.delete('/api/turmas/:id',async(req,res)=>{try{res.json(await db.excluirTurma(req.params.id,req.body?.confirmarNome));}catch(e){res.status(400).json({erro:e.message});}});
app.get('/api/turmas/:id/avaliacoes',async(req,res)=>{try{res.json(await db.listarAvaliacoes(req.params.id));}catch(e){res.status(404).json({erro:e.message});}});
app.put('/api/turmas/:id/avaliacoes/:avaliacaoId',async(req,res)=>{try{res.json(await db.upsertAvaliacao(req.params.id,req.params.avaliacaoId,req.body));}catch(e){res.status(500).json({erro:e.message});}});
app.delete('/api/turmas/:id/avaliacoes/:avaliacaoId',async(req,res)=>{try{await db.removerAvaliacao(req.params.id,req.params.avaliacaoId);res.json({ok:true});}catch(e){res.status(500).json({erro:e.message});}});
app.delete('/api/turmas/:id/avaliacoes',async(req,res)=>{try{await db.limparAvaliacoes(req.params.id);res.json({ok:true});}catch(e){res.status(500).json({erro:e.message});}});
app.get('/api/backup/github',(_req,res)=>res.json(db.statusBackupGitHub()));
app.post('/api/backup/github',async(_req,res)=>{try{res.json(await db.sincronizarBackupGitHub());}catch(e){res.status(503).json({erro:e.message,...db.statusBackupGitHub()});}});

function textoCampo(valor){
  const s=String(valor||'').trim();
  return s || '(não preenchido)';
}

function montarPrompt(campos={}){
  const rubrica = ORDEM.map(chave=>{
    const c=RUBRICA[chave];
    return `${chave} — ${c.label} (máximo ${c.max}):\n${c.niveis.map(n=>`- ${n.pontos} ponto(s): ${n.desc}`).join('\n')}`;
  }).join('\n\n');
  return `Você auxilia um professor a avaliar a atividade P5 - Mediação com Agente de IA, do TEDPRO/IFSC. Aplique SOMENTE a rubrica oficial. Escolha exatamente um valor previsto em cada critério. Não premie extensão, sofisticação técnica ou semelhança com o agente-modelo OSCAR por si sós.

REGRAS DE EVIDÊNCIA
- Diferencie texto extraído do PDF de observação manual do professor.
- Capturas de tela não podem ser consideradas legíveis apenas porque há imagens no PDF. Use a observação do professor sobre evidências; se estiver ausente ou inconclusiva, seja conservador em testagem.
- Não afirme que o link público funciona se a verificação não estiver registrada.
- Para configuração, procure nas instruções: papel, tarefas, público, contexto, limites, tom e formato das respostas. Não basta o campo existir.
- Para fontes, aceite a declaração explícita de que nenhuma fonte foi usada. Quando houver fontes, exija origem/tipo, motivo e função.
- Para transparência, não confunda o Gem, que é objeto obrigatório da atividade, com outras IAs usadas para redigir o relatório.
- Produza justificativas específicas, citando evidências ou ausências concretas.

RUBRICA OFICIAL
${rubrica}

DADOS EXTRAÍDOS E REVISTOS
Nome: ${textoCampo(campos.nome)}
Matrícula: ${textoCampo(campos.matricula)}
Orientador(a): ${textoCampo(campos.orientador)}
Arquivo em PDF e estrutura do modelo: ${textoCampo(campos.conformidadeModelo)}
Desafio: ${textoCampo(campos.desafio)}
Demanda escolhida: ${textoCampo(campos.demanda)}
Público e contexto: ${textoCampo(campos.publicoContexto)}
Resultado esperado: ${textoCampo(campos.resultadoEsperado)}
Nome do Gem: ${textoCampo(campos.nomeGem)}
Descrição: ${textoCampo(campos.descricaoGem)}
Instruções integrais: ${textoCampo(campos.instrucoesGem)}
Ferramenta padrão e função: ${textoCampo(campos.ferramentaPadrao)}
Fontes/base de conhecimento: ${textoCampo(campos.fontesConhecimento)}
Configuração das citações: ${textoCampo(campos.citacoesStatus)}
Justificativa das citações: ${textoCampo(campos.citacoes)}
Link público: ${textoCampo(campos.linkGem)}
Verificação manual do acesso: ${textoCampo(campos.linkVerificado)}
Outras configurações: ${textoCampo(campos.outrasConfiguracoes)}
Objetivo do teste: ${textoCampo(campos.objetivoTeste)}
Resultado esperado do teste: ${textoCampo(campos.resultadoEsperadoTeste)}
Evidências/capturas e legibilidade: ${textoCampo(campos.evidenciasTeste)}
O que funcionou bem: ${textoCampo(campos.funcionouBem)}
O que precisa melhorar: ${textoCampo(campos.precisaMelhorar)}
Ajustes realizados ou previstos: ${textoCampo(campos.ajustes)}
Contribuição ao desafio e limites: ${textoCampo(campos.contribuicao)}
Declaração de IA no relatório: ${textoCampo(campos.iaDeclaracao)}
Descrição do uso de IA: ${textoCampo(campos.iaDescricao)}

Responda APENAS em JSON válido:
{"pontuacoes":{"modelo":{"pontos":0,"justificativa":""},"demanda":{"pontos":0,"justificativa":""},"configuracao":{"pontos":0,"justificativa":""},"testagem":{"pontos":0,"justificativa":""},"analise":{"pontos":0,"justificativa":""},"contribuicao":{"pontos":0,"justificativa":""},"transparencia":{"pontos":0,"justificativa":""}},"alertas":[""],"feedback":"Texto pedagógico ao estudante, em parágrafos, com evidências, pontos fortes e próximos passos. Termine exatamente com: Um abraço,\\nProf. Rogério"}`;
}

function pontoValido(chave,pontos){
  const niveis=RUBRICA[chave].niveis;
  const numero=Number(pontos);
  if(niveis.some(n=>n.pontos===numero)) return numero;
  return niveis.reduce((melhor,n)=>Math.abs(n.pontos-numero)<Math.abs(melhor-numero)?n.pontos:melhor,niveis[0].pontos);
}

function limparAvaliacao(resultado={}){
  const pontuacoes={};
  for(const chave of ORDEM){
    const item=resultado.pontuacoes?.[chave]||{};
    pontuacoes[chave]={pontos:pontoValido(chave,item.pontos),justificativa:String(item.justificativa||'').trim()};
  }
  let feedback=String(resultado.feedback||'').trim().replace(/\s*Um abraço,\s*Prof\. Rogério\s*$/i,'').trim();
  feedback += '\n\nUm abraço,\nProf. Rogério';
  return {pontuacoes,alertas:Array.isArray(resultado.alertas)?resultado.alertas.map(String).filter(Boolean):[],feedback};
}

async function chamarOpenAI(prompt,temperatura=0.2){
  const resposta=await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:OPENAI_MODEL,response_format:{type:'json_object'},temperature:temperatura,messages:[{role:'user',content:prompt}]})
  });
  if(!resposta.ok){
    const detalhe=await resposta.text().catch(()=>'');
    console.error('OpenAI',resposta.status,detalhe);
    throw new Error(`A API da OpenAI recusou a análise (${resposta.status}).`);
  }
  const data=await resposta.json();
  return JSON.parse(data.choices?.[0]?.message?.content||'{}');
}

app.post('/api/avaliar',async(req,res)=>{
  if(!OPENAI_API_KEY) return res.json(avaliarLocalmente(req.body||{}));
  try{res.json(limparAvaliacao(await chamarOpenAI(montarPrompt(req.body||{}))));}
  catch(e){res.status(502).json({erro:e.message});}
});

function avaliarLocalmente(c={}){
  const preenchido=(...xs)=>xs.every(x=>String(x||'').trim());
  const confirmado=String(c.linkVerificado||'').startsWith('Sim');
  const evidenciaConfirmada=preenchido(c.objetivoTeste,c.resultadoEsperadoTeste,c.evidenciasTeste)&&!/não comprova|precisa(?:m)? de inspeção|confirme manualmente/i.test(c.evidenciasTeste);
  const p={
    modelo:{pontos:/PDF/i.test(c.conformidadeModelo||'')&&preenchido(c.nome,c.matricula)?1:0,justificativa:'Pontuação baseada no formato e na identificação registrados no formulário.'},
    demanda:{pontos:preenchido(c.desafio,c.demanda,c.publicoContexto,c.resultadoEsperado)?1:0,justificativa:'Verificação da presença do desafio, demanda, público/contexto e resultado esperado.'},
    configuracao:{pontos:preenchido(c.nomeGem,c.descricaoGem,c.instrucoesGem,c.ferramentaPadrao,c.fontesConhecimento,c.citacoesStatus,c.citacoes,c.linkGem,c.outrasConfiguracoes)?(confirmado?2:1):preenchido(c.nomeGem,c.instrucoesGem)?1:0,justificativa:confirmado?'Configuração registrada e acesso público confirmado pelo professor.':'Há configuração registrada, mas o acesso público ou algum componente ainda não foi confirmado.'},
    testagem:{pontos:evidenciaConfirmada?2:preenchido(c.objetivoTeste,c.resultadoEsperadoTeste)?1:0,justificativa:evidenciaConfirmada?'Objetivo, resultado esperado e evidências foram registrados e confirmados.':'Há descrição do teste, mas a legibilidade das capturas ainda exige confirmação visual do professor.'},
    analise:{pontos:preenchido(c.funcionouBem,c.precisaMelhorar,c.ajustes)?2:preenchido(c.funcionouBem)||preenchido(c.precisaMelhorar)||preenchido(c.ajustes)?1:0,justificativa:'Pontuação baseada na presença de análise de resultados, limitações e ajustes.'},
    contribuicao:{pontos:preenchido(c.contribuicao)?1:0,justificativa:preenchido(c.contribuicao)?'A contribuição do agente foi explicada.':'A contribuição do agente não foi registrada.'},
    transparencia:{pontos:preenchido(c.iaDeclaracao)&&(c.iaDeclaracao==='Não utilizou IA além do Gem'||preenchido(c.iaDescricao))?1:0,justificativa:'Verificação da declaração de uso de IA além do próprio Gem.'}
  };
  const resultado=limparAvaliacao({pontuacoes:p,alertas:['Avaliação automática local: revise semanticamente as sugestões e confirme visualmente as capturas.'],feedback:'A avaliação automática local verificou o preenchimento e as confirmações registradas. Revise as justificativas da rubrica, valide as capturas de tela e ajuste a pontuação quando necessário.'});
  return {...resultado,modo:'local'};
}

function montarPromptAgente(campos={}){
  return `Analise pedagogicamente a concepção de um Gem criado por estudante do TEDPRO/IFSC. Esta análise é complementar, não atribui nota e não substitui a rubrica.
Examine o encadeamento desafio -> demanda -> público/contexto -> resultado esperado -> instruções -> fontes/ferramentas -> teste -> refinamento -> contribuição.
Nas instruções, examine papel, tarefas, público, contexto, limites, tom, formato, privacidade, manejo de incerteza e critérios de resposta. Use o OSCAR apenas como exemplo abstrato de instruções estruturadas; não exija seu tema, extensão ou estilo.
Não invente funcionamento do agente. Diferencie configuração declarada, evidência do teste e intenção futura. Aponte riscos concretos, contradições, lacunas e melhorias acionáveis.

Desafio: ${textoCampo(campos.desafio)}
Demanda: ${textoCampo(campos.demanda)}
Público/contexto: ${textoCampo(campos.publicoContexto)}
Resultado esperado: ${textoCampo(campos.resultadoEsperado)}
Descrição: ${textoCampo(campos.descricaoGem)}
Instruções: ${textoCampo(campos.instrucoesGem)}
Ferramenta: ${textoCampo(campos.ferramentaPadrao)}
Fontes: ${textoCampo(campos.fontesConhecimento)}
Citações: ${textoCampo(campos.citacoesStatus)}. Justificativa: ${textoCampo(campos.citacoes)}
Objetivo e resultado esperado do teste: ${textoCampo(campos.objetivoTeste)} / ${textoCampo(campos.resultadoEsperadoTeste)}
Evidências: ${textoCampo(campos.evidenciasTeste)}
Análise do estudante: ${textoCampo(campos.funcionouBem)} / ${textoCampo(campos.precisaMelhorar)}
Ajustes: ${textoCampo(campos.ajustes)}
Contribuição: ${textoCampo(campos.contribuicao)}

Responda APENAS em JSON:
{"parecer":"2 a 4 parágrafos para o professor","pontosFortes":[""],"riscosELacunas":[""],"sugestoesDeRefinamento":[""]}`;
}

app.post('/api/analisar-agente',async(req,res)=>{
  if(!OPENAI_API_KEY) return res.json(analisarAgenteLocalmente(req.body||{}));
  try{res.json(await chamarOpenAI(montarPromptAgente(req.body||{}),0.25));}
  catch(e){res.status(502).json({erro:e.message});}
});

function analisarAgenteLocalmente(c={}){
  const tem=x=>Boolean(String(x||'').trim());
  const instrucoes=String(c.instrucoesGem||'');
  const fortes=[],riscos=[],sugestoes=[];
  if(tem(c.desafio)&&tem(c.demanda)&&tem(c.publicoContexto)&&tem(c.resultadoEsperado)) fortes.push('O encadeamento entre desafio, demanda, público, contexto e resultado esperado está registrado.');
  else riscos.push('O encadeamento entre desafio, demanda, público/contexto e resultado esperado está incompleto.');
  if(/papel|persona|você é/i.test(instrucoes)&&/formato|parágrafo|tópico|bullet|lista/i.test(instrucoes)&&/não|evite|limite|restri/i.test(instrucoes)) fortes.push('As instruções apresentam indícios de papel, formato de resposta e limites de atuação.');
  else sugestoesInstrucao();
  if(tem(c.fontesConhecimento)) fortes.push('A Base de Conhecimento foi registrada com fontes e funções declaradas.');
  else riscos.push('Não há Base de Conhecimento registrada nem declaração explícita de que ela não foi utilizada.');
  if(!tem(c.citacoesStatus)) riscos.push('A configuração de citações não foi identificada.');
  if(!String(c.linkVerificado||'').startsWith('Sim')) riscos.push('O acesso público ao Gem ainda não foi confirmado pelo professor.');
  if(tem(c.objetivoTeste)&&tem(c.resultadoEsperadoTeste)) fortes.push('O teste possui objetivo e resultado esperado explicitados.');
  else sugestões.push('Definir, antes do teste, o comportamento que será verificado e o que caracterizaria uma resposta satisfatória.');
  if(/não comprova|inspeção visual|confirme manualmente/i.test(c.evidenciasTeste||'')) riscos.push('As capturas ainda precisam de inspeção visual para confirmar a legibilidade da solicitação e da resposta.');
  if(tem(c.precisaMelhorar)&&tem(c.ajustes)) fortes.push('O relatório relaciona limitações observadas a ajustes realizados ou previstos.');
  else sugestões.push('Relacionar cada falha encontrada no teste a um ajuste concreto e, depois, repetir o teste.');
  if(!tem(c.contribuicao)) riscos.push('A contribuição do agente para o desafio e seus limites não foram explicados.');
  sugestoes.push('Realizar ao menos um novo teste com entrada difícil ou ambígua para verificar limites, manejo de incerteza e preservação da autoria do usuário.');
  function sugestoesInstrucao(){riscos.push('As instruções não evidenciam claramente todos os elementos de papel, tarefa, formato e limites.');sugestoes.push('Explicitar nas instruções o papel do agente, tarefas, público, contexto, tom, formato das respostas, limites e comportamento diante de incerteza.');}
  const parecer=`A análise local encontrou ${fortes.length} aspecto(s) estruturados e ${riscos.length} ponto(s) que merecem verificação. Ela examina apenas o conteúdo registrado no formulário e não afirma que o agente executa corretamente o que foi planejado.\n\nA confirmação do funcionamento depende do acesso ao link e da leitura das capturas. Use os itens abaixo como roteiro de revisão pedagógica; esta análise não altera a nota da rubrica.`;
  return {parecer,pontosFortes:fortes,riscosELacunas:riscos,sugestoesDeRefinamento:sugestoes,modo:'local'};
}

function montarPromptExtracao({paginas=[],camposPreliminares={}}={}){
  const textoPaginas=(Array.isArray(paginas)?paginas:[]).slice(0,30).map((p,i)=>`\n===== PÁGINA ${i+1} =====\n${String(p||'').slice(0,30000)}`).join('\n');
  return `Extraia fielmente as respostas de um relatório preenchido da atividade P5 - Mediação com Agente de IA (TEDPRO/IFSC).

OBJETIVO
Corrigir uma extração automática que pode ter misturado enunciados, cabeçalhos, rodapés, colunas de tabela e páginas. Faça análise semântica da estrutura do formulário, mas NÃO resuma, não melhore e não invente respostas.

REGRAS OBRIGATÓRIAS
- Retorne somente o conteúdo realmente preenchido pelo estudante. Exclua títulos, perguntas, instruções do formulário, cabeçalhos, rodapés e marcadores como "ESCREVA AQUI" ou "COLE AQUI".
- Preserve integralmente as instruções do item 3.3, inclusive listas, limites, tom e formato. Não misture o enunciado "Copie integralmente..." com a resposta.
- No item 3.4, separe somente a ferramenta escolhida e a explicação de sua função.
- O item 3.5 é uma tabela. Reconstrua cada linha semanticamente como: "Nº | Fonte/arquivo | Origem e tipo | Função no agente". Não misture células de linhas diferentes. Se o estudante declarou que não utilizou fontes, preserve essa declaração.
- No item 3.6, extraia separadamente citacoesStatus (exatamente "Ativadas", "Desativadas" ou "") e citacoes (somente a justificativa); também separe link público e outras decisões de configuração.
- Capturas de tela são imagens. Não invente nem descreva o conteúdo visual com base no texto ao redor. Em evidenciasTeste, registre apenas textos/captions extraídos e diga que as imagens precisam de inspeção visual quando aplicável.
- Separe rigorosamente: objetivo do teste; resultado esperado; o que funcionou bem; o que precisa melhorar; ajustes realizados ou previstos; contribuição para o desafio; declaração de IA; descrição de ferramentas/finalidade/forma de uso.
- A declaração de IA refere-se a ferramentas usadas para elaborar o RELATÓRIO além do Gem. Use iaDeclaracao exatamente como "Utilizou IA além do Gem", "Não utilizou IA além do Gem" ou "" quando não for possível identificar marcação.
- Um campo ausente ou apenas com texto do modelo deve ser "".
- O link do Gem deve vir do texto; o aplicativo pode complementar depois com hiperlinks anotados no PDF.

CAMPOS PRELIMINARES (podem estar errados; use apenas como pista)
${JSON.stringify(camposPreliminares)}

TEXTO EXTRAÍDO POR PÁGINA
${textoPaginas}

Responda APENAS com JSON válido, contendo todas estas chaves:
{"nome":"","matricula":"","orientador":"","desafio":"","demanda":"","publicoContexto":"","resultadoEsperado":"","nomeGem":"","descricaoGem":"","instrucoesGem":"","ferramentaPadrao":"","fontesConhecimento":"","citacoesStatus":"","citacoes":"","linkGem":"","outrasConfiguracoes":"","objetivoTeste":"","resultadoEsperadoTeste":"","evidenciasTeste":"","funcionouBem":"","precisaMelhorar":"","ajustes":"","contribuicao":"","iaDeclaracao":"","iaDescricao":""}`;
}

function limparExtracaoSemantica(resultado={}){
  const chaves=['nome','matricula','orientador','desafio','demanda','publicoContexto','resultadoEsperado','nomeGem','descricaoGem','instrucoesGem','ferramentaPadrao','fontesConhecimento','citacoesStatus','citacoes','linkGem','outrasConfiguracoes','objetivoTeste','resultadoEsperadoTeste','evidenciasTeste','funcionouBem','precisaMelhorar','ajustes','contribuicao','iaDeclaracao','iaDescricao'];
  const saida={};
  for(const chave of chaves) saida[chave]=String(resultado?.[chave]||'').trim();
  if(!['Ativadas','Desativadas'].includes(saida.citacoesStatus)) saida.citacoesStatus='';
  if(!['Utilizou IA além do Gem','Não utilizou IA além do Gem'].includes(saida.iaDeclaracao)) saida.iaDeclaracao='';
  return saida;
}

app.post('/api/extrair-relatorio',async(req,res)=>{
  if(precisaChave(res)) return;
  try{res.json(limparExtracaoSemantica(await chamarOpenAI(montarPromptExtracao(req.body||{}),0)));}
  catch(e){res.status(502).json({erro:e.message});}
});

app.use((err,_req,res,_next)=>res.status(500).json({erro:err.message||'Erro interno.'}));

if(require.main===module) app.listen(PORT,()=>console.log(`Avaliador P5 em http://localhost:${PORT}`));
module.exports={app,montarPrompt,montarPromptAgente,montarPromptExtracao,limparExtracaoSemantica,limparAvaliacao,avaliarLocalmente,analisarAgenteLocalmente,pontoValido};
