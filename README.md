Aracnator
=========

   Aracnator é um sistema especialista que reconhece a espécie de
uma aranha a partir de perguntas respondidas pelo usuário.

   O sistema monta uma árvore de decisão a partir de uma base
de conhecimento com informações sobre diferentes espécies de aranhas.

Introdução
----------

   De acordo com o Ministério da Saúde, entre 2010 e 2014 foram
notificados 691.307 acidentes por animais peçonhentos, dos quais
1.282 evoluíram para óbito. Aranhas foram responsáveis por 27.119
dessas notificações, sendo 13 óbitos.
Fonte: [Acidentes por Animais Peçonhentos](http://portalarquivos.saude.gov.br/images/pdf/2016/maio/20/Informe-Epidemiol--gico-animais-pe--onhentos---.pdf).

   Foram selecionadas espécies de aranhas e pesquisados dados
morfológicos, de hábitos e distribuição geográfica. O arquivo
`base.json` com a compilação dessas informações deve estar junto
deste script para o funcionamento correto do sistema.

   A ideia original foi montada usando o Expert SINTA. O arquivo
`aranhas.bcm` ainda pode ser visualizado na pasta. 

   O SINTA ajudou a formular a ideia original, mas foi abandonado
porque, apesar de sua interface fácil, o sistema atingiu 15 regras
após a inserção de informações sobre 3 espécies, que o tornaria
difícil de gerenciar e corrigir para um número maior de espécies.


Funcionamento
-------------

   Para construção da árvore de decisões é utilizado o algoritmo C4.5,
desenvolvido por [Ross Quinlan](http://www.rulequest.com/Personal/).
A implementação mostrada aqui foi adaptada a partir do código de
[Timofey Trukhanov](https://github.com/geerk/C45algorithm) em Python.

   Após a construção de um nível da árvore, a pergunta com maior
ganho de informação é exibida ao usuário. Ao responder, as classes
pertencentes o outro ramo são descartadas e o algoritmo procede
para o próximo nó.

   Caso o usuário não tenha a resposta para uma pergunta, em vez de
assumir um valor padrão, é gerada uma nova árvore de decisões ignorando
a variável desconhecida.

   Ao chegar ao nó folha, são exibidas as possíveis respostas. Se duas
ou mais resposta contradizerem os dados da base de conhecimento, ocorre
um impasse e é dado um aviso ao usuário.

Execução
--------

   O arquivo está formatado para ser executado diretamente, usando
o Node.js.

	node aracnator.js

Possíveis melhorias
-------------------

   Os dados foram coletados de forma amadora, apenas para provar o
conceito, sendo necessária uma validação por um biólogo antes que o
sistema possa ser empregado em um cenário real.

   Com ajuda de um especialista, poderia ser possível distinguir 
diferentes espécies dentro do mesmo gênero e inclusive diferenciar
entre espécimes machos e fêmeas.

   O sistema também não leva em conta a probabilidade de encontro,
com a espécie (com base na população estimada, por exemplo), o que
seria importante se o sistema for classificar um número maior de
espécies.