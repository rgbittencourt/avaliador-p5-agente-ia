# Avaliador P5 - Agente de IA (TEDPRO)

PWA para apoiar a avaliação da atividade **P5 - Mediação com Agente de IA** do TEDPRO/IFSC. A ferramenta segue os sete critérios e os níveis de pontuação da rubrica fornecida.

## Funcionalidades

- importação do relatório PDF no modelo oficial;
- extração e revisão dos campos da atividade;
- detecção de links anotados e contagem cautelosa de objetos de imagem;
- rubrica completa de 10 pontos, integralmente editável;
- sugestão automática de notas, justificativas, alertas e feedback;
- análise complementar da concepção do agente, sem pontuação;
- feedback, observações e alertas editáveis;
- turmas nomeadas, avaliações reabertas e detecção de duplicidade;
- exportação JSON e CSV, importação JSON e relatório executivo;
- persistência local ou PostgreSQL/Neon;
- backup automático opcional em repositório GitHub privado;
- instalação como aplicativo (PWA) em computador, tablet e celular.

## Executar localmente

Requer Node.js 18 ou superior.

```bash
cp .env.example .env
npm install
npm start
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

- `OPENAI_API_KEY`: chave para avaliação automática e análise complementar;
- `OPENAI_MODEL`: padrão `gpt-4o-mini`;
- `APP_USERNAME` e `APP_PASSWORD`: proteção das APIs;
- `DATABASE_URL`: PostgreSQL/Neon; sem ela, usa `data/turmas.json`;
- `GITHUB_DATA_*`: repositório privado de backup das turmas.

## Critérios da rubrica

1. Uso do modelo obrigatório e formato da entrega - 1 ponto.
2. Retomada do desafio e delimitação da demanda - 1 ponto.
3. Configuração, fontes e acesso ao Gem - 2 pontos.
4. Testagem e evidências da interação - 2 pontos.
5. Análise crítica e refinamento - 2 pontos.
6. Contribuição para o desafio - 1 ponto.
7. Transparência sobre IA na elaboração do relatório - 1 ponto.

## Privacidade

O PDF é lido no navegador. Somente os campos textuais revisados pelo professor são enviados à API quando uma análise automática é solicitada. O PDF original não é armazenado pelo servidor.

