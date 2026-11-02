const RUBRICA = {
  modelo: {
    label: 'Uso do modelo obrigatório e formato da entrega', max: 1,
    niveis: [
      {pontos:0, desc:'Não entrega o relatório em PDF no modelo obrigatório, ou apresenta o documento sem os dados de identificação solicitados.'},
      {pontos:1, desc:'Entrega o relatório em PDF, utilizando o modelo obrigatório, com nome, matrícula e orientador(a) preenchidos e preservando a estrutura das seções e a leitura de textos, tabelas e imagens.'}
    ]
  },
  demanda: {
    label: 'Retomada do desafio e delimitação da demanda', max: 1,
    niveis: [
      {pontos:0, desc:'Não apresenta a pergunta-desafio iniciada por “Como podemos...”, ou não delimita uma demanda relacionada a ela. Omite ou descreve de forma insuficiente o que o agente deverá fazer, seu público, o contexto de uso ou o resultado esperado.'},
      {pontos:1, desc:'Retoma a pergunta-desafio do portfólio, iniciada por “Como podemos...”, e delimita uma demanda específica e viável vinculada a ela. Explica o que o agente deverá ajudar a fazer, quem o utilizará, em qual situação e o que deverá entregar ou tornar possível, mantendo coerência entre esses elementos.'}
    ]
  },
  configuracao: {
    label: 'Registro da configuração, das fontes e do acesso ao Gem', max: 2,
    niveis: [
      {pontos:0, desc:'Não registra a configuração do Gem, ou apresenta informações insuficientes para compreender o agente criado e a versão utilizada no teste.'},
      {pontos:1, desc:'Registra parte da configuração, mas omite elementos relevantes das instruções, a função da ferramenta, informações sobre as fontes utilizadas ou a justificativa da configuração de citações. Também se enquadra neste nível o registro completo acompanhado de link ausente ou sem compartilhamento habilitado.'},
      {pontos:2, desc:'Registra a configuração efetivamente utilizada na testagem: nome, descrição cadastrada e instruções integrais, com papel, tarefas, público, contexto, limites, tom e formato das respostas. Informa a ferramenta padrão e sua função, ou indica “nenhuma”; identifica cada fonte adicionada, sua origem, tipo, motivo da escolha e função no agente. Indica e justifica citações, registra outras decisões relevantes e fornece link público com acesso habilitado. Caso não tenha adicionado fontes, deixa essa condição explícita.'}
    ]
  },
  testagem: {
    label: 'Testagem em situação realista e evidências da interação', max: 2,
    niveis: [
      {pontos:0, desc:'Não documenta teste do Gem, ou as capturas não permitem ler a solicitação e a resposta do agente, impedindo a verificação da interação.'},
      {pontos:1, desc:'Apresenta capturas legíveis da solicitação e da resposta, mas não explicita adequadamente o objetivo ou o resultado esperado, ou utiliza uma situação pouco relacionada à demanda escolhida.'},
      {pontos:2, desc:'Documenta pelo menos um teste significativo em situação realista e coerente com a demanda. Explicita o que pretende verificar e como seria uma resposta satisfatória, incluindo o resultado esperado, e apresenta capturas que permitem ler a solicitação e a resposta do Gem.'}
    ]
  },
  analise: {
    label: 'Análise crítica dos resultados e refinamento', max: 2,
    niveis: [
      {pontos:0, desc:'Não analisa os resultados, ou limita-se a afirmar que o agente funcionou ou não funcionou, sem discutir as respostas obtidas nem indicar ajustes.'},
      {pontos:1, desc:'Identifica aspectos positivos e pontos a melhorar, mas a análise permanece genérica ou pouco relacionada às interações registradas. Os ajustes realizados ou previstos são vagos ou não respondem claramente às dificuldades identificadas.'},
      {pontos:2, desc:'Analisa as respostas registradas quanto à utilidade, qualidade, clareza e adequação ao público, ao contexto e à demanda, considerando o uso das fontes quando aplicável. Explica o que funcionou, identifica falhas ou lacunas e descreve ajustes realizados ou previstos, relacionando-os à análise dos testes.'}
    ]
  },
  contribuicao: {
    label: 'Contribuição do agente para o desafio do portfólio', max: 1,
    niveis: [
      {pontos:0, desc:'Não explica a contribuição do Gem para o desafio, ou apresenta uma relação genérica sem esclarecer a parte apoiada, os beneficiários ou os limites dessa contribuição.'},
      {pontos:1, desc:'Retoma o desafio e explica como o Gem pode contribuir para enfrentá-lo, delimitando a parte que apoia, quem pode se beneficiar e os limites dessa contribuição, sem pressupor que o agente precise resolver o desafio inteiro.'}
    ]
  },
  transparencia: {
    label: 'Transparência sobre o uso de IA na elaboração do relatório', max: 1,
    niveis: [
      {pontos:0, desc:'Não responde à declaração, confunde a criação e a testagem do Gem com o uso de IA para elaborar o relatório, ou declara esse uso sem identificar as ferramentas, suas finalidades e como foram empregadas.'},
      {pontos:1, desc:'Responde à declaração referente especificamente ao auxílio de IA na elaboração do relatório, além do Gem criado como objeto da atividade. Se declara uso, identifica as ferramentas e explica para quê e como foram empregadas; se declara não uso, assinala essa opção de forma clara. Usar ou não usar IA não altera a pontuação.'}
    ]
  }
};
const ORDEM = ['modelo','demanda','configuracao','testagem','analise','contribuicao','transparencia'];
module.exports = {RUBRICA, ORDEM};
