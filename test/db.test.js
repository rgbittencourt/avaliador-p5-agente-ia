const test=require('node:test');
const assert=require('node:assert/strict');
const {pareceTurmaP5,mesclarTurmasP5}=require('../db');

test('identifica turmas P5 antigas sem confundir avaliações de podcast',()=>{
  assert.equal(pareceTurmaP5({nome:'CALABRESA',avaliacoes:[]}),true);
  assert.equal(pareceTurmaP5({nome:'Outra',avaliacoes:[{nomeGem:'Tutor'}]}),true);
  assert.equal(pareceTurmaP5({nome:'Podcast',avaliacoes:[{linkPodcast:'https://spotify.com'}]}),false);
});

test('recupera turmas e avaliações antigas sem substituir registros atuais',()=>{
  const atual={version:2,turmas:[{id:'calabresa',nome:'CALABRESA',avaliacoes:[{id:'a1',nome:'Atual'}]}]};
  const legado={version:2,turmas:[{id:'calabresa',nome:'CALABRESA',avaliacoes:[{id:'a1',nome:'Antiga'},{id:'a2',nome:'Recuperada'}]},{id:'portuguesa',nome:'PORTUGUESA',avaliacoes:[]},{id:'podcast',nome:'Podcast',avaliacoes:[{id:'p1',linkPodcast:'x'}]}]};
  const r=mesclarTurmasP5(atual,legado);
  assert.deepEqual(r.turmas.map(t=>t.nome),['CALABRESA','PORTUGUESA']);
  assert.deepEqual(r.turmas[0].avaliacoes.map(a=>a.nome),['Atual','Recuperada']);
});
