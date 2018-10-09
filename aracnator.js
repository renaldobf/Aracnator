// Verifica se está executando no navegador
var isBrowser = new Function('try{return this===window;}catch(e){return false;}');
// Carrega a base de conhecimento
var base = require('./base.json');
// Estado de trabalho uma consulta
var state;

/*
	Faz uma cópia profunda (clone) de um objeto.
*/
function clone(item) {
	return JSON.parse(JSON.stringify(item));
}

/*
	Remove valores duplicados de um array.
*/
function deldup(array) {
	return array.filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a>b);
}

/*
	Processa a base de conhecimento, separando as variáveis e os valores.
*/
function processar(base) {
	let variaveis = [];
	let valores = [];
	let intervalos = [];

	// Adiciona as variáveis de "perguntas"
	for (let i=0; i<base.perguntas.length; i++)
		if (variaveis.indexOf(base.perguntas[i].variavel) < 0)
			variaveis.push(base.perguntas[i].variavel)
	
	// Busca variáveis não definidas em "perguntas"
	for (let i=0; i<base.saidas.length; i++) {
		let c = base.saidas[i].entradas;
		for (let j=0; j<c.length; j++) {
			// Adicina nova variável
			if (variaveis.indexOf(c[j].variavel) < 0)
				variaveis.push(c[j].variavel);
			// Verifica se já existem valores
			if (!valores[c[j].variavel])
				valores[c[j].variavel] = [];
			// Adiciona valores de Arrays
			if (c[j].valor instanceof Array)
				valores[c[j].variavel] = valores[c[j].variavel].concat(c[j].valor);
			// Adiciona valores soltos
			else
				valores[c[j].variavel].push(c[j].valor);
			// Verifica se a variável é pode assumir valores em um intervalor
			if (c[j].intervalo)
				intervalos.push(c[j].variavel);
		}
	}
	// Remove valores duplicados
	for (let i=0; i<variaveis.length; i++)
		valores[variaveis[i]] = deldup(valores[variaveis[i]]);

	base.variaveis = variaveis;
	base.valores = valores;
	base.intervalos = deldup(intervalos);
}

/*
	Função que verifica se o valor da resposta corresponde à saída
*/
function verifica(saida, variavel, valor) {
	let i;
	for (i=0; i<saida.entradas.length; i++)
		if (saida.entradas[i].variavel == variavel) break;
	if (i >= saida.entradas.length)
		return false;
	if (saida.entradas[i].valor instanceof Array) {
		if (saida.entradas[i].intervalo)
			return valor >= saida.entradas[i].valor[0] && valor <= saida.entradas[i].valor[1];
		else
			return saida.entradas[i].valor.indexOf(valor) >= 0;
	}
	return saida.entradas[i].valor == valor;
}

/*
	Cria novas saídas sem uma variável
*/
function del_values(saidas, variavel, valor) {
	let novas_saidas = clone(saidas); //.slice(0);
	for (let i=0; i<novas_saidas.length; i++) {
		if (valor != null && !verifica(novas_saidas[i], variavel, valor)) {
			novas_saidas.splice(i,1);
			i--;
			continue;
		}
		for (let j=0; j<novas_saidas[i].entradas.length; j++) {
			if (novas_saidas[i].entradas[j].variavel == variavel) {
				novas_saidas[i].entradas.splice(j,1);
				j--;
			}
		}
	}
	return novas_saidas;
}

/*
	Retorna os possíveis valores de uma variável dadas as
	possíveis saídas.
*/
function get_valores(saidas, variavel) {
	let valores = [];
	for (let i=0; i<saidas.length; i++) {
		let c = saidas[i].entradas;
		for (let j=0; j<c.length; j++) {
			if (c[j].variavel != variavel)
				continue;
			if (c[j].valor instanceof Array)
				valores = valores.concat(c[j].valor);
			else
				valores.push(c[j].valor);
		}
	}
	valores = deldup(valores);
	return valores;
}

/*
	Retorna as saídas divididas pelos possíveis valores da variável.
*/
function get_subtables(saidas, variavel) {
	let valores = get_valores(saidas, variavel);

	let subtables = [];
	for (let i=0; i<valores.length; i++) {
		subtables.push(del_values(saidas, variavel, valores[i]));
	}
	return subtables;
}

/*
	Calcula a entropia das saídas para uma variável de entrada.
*/
function info(saidas) {
	let soma = 0;
	for (let i=0; i<saidas.length; i++) {
		let p = 1 / saidas.length;
		soma += p * Math.log2(p);
	}
	return -soma;
}

/*
	Calcula a entropia das saídas após dividir o nó baseado nos
	possíveis valores de uma variável de entrada.
*/
function infox(saidas, variavel) {
	let soma = 0;
	let subt = get_subtables(saidas, variavel);
	for (let i=0; i<subt.length; i++)
		soma += subt[i].length / saidas.length * info(subt[i]);
	return soma;
}

/*
	Função que calcula o ganho de informação de uma alternativa.
*/
function gain(saidas, variavel) {
	return info(saidas) - infox(saidas, variavel);
}

/*
	Ponto de entradas do algoritmo C45.
*/
function c45(saidas, variaveis) {
	let max = 0, max_variable = null;
	for (let i=0; i < variaveis.length; i++) {
		let v = variaveis[i];
		let g = gain(saidas, v);
		if (g > max) {
			max = g;
			max_variable = v;
		}
	}
	return max_variable;
}

/*
	Cria um novo estado de trabalho
*/
function reset_state() {
	state = clone(base);
}

/*
	Finaliza a execução da busca
*/
function finalizar() {
	process.exit(0);
}

/*
	Cria um novo nó na árvore.
*/
function iterate() {
	if (state.saidas.length == 0) {
		console.log('Os dados informados não correspondem a nenhuma saída possível.');
		finalizar();
		return;
	}
	if (state.saidas.length == 1) {
		console.log('Resposta encontrada:');
		console.log(state.saidas[0].valor);
		finalizar();
		return;
	}
	let variavel = c45(state.saidas, state.variaveis);
	if (!variavel) {
		console.log('Nenhuma resposta encontrada');
		console.log(state.saidas.length+' possíveis valores');
		console.log(state.saidas.map((a)=>a.valor).join(', '));
		finalizar();
		return;
	}
	state.valores[variavel] = get_valores(state.saidas, variavel);
	faz_pergunta(variavel);
}

/*
	Exibe uma pergunta ao usuário
*/
function faz_pergunta(variavel) {
	let pergunta = 'Informe o valor para a variável "' + variavel+'": ';
	for (let i=0; i<base.perguntas.length; i++) {
		if (base.perguntas[i].variavel == variavel)
			pergunta = base.perguntas[i].pergunta;
	}
	let opcoes;
	if (base.intervalos.indexOf(variavel) >= 0)
		opcoes = 'Valores entre ('+state.valores[variavel][0]+')'
			+' e ('+state.valores[variavel][state.valores[variavel].length-1]+')';
	else
		opcoes = state.valores[variavel].join(', ');
	state.variavel = variavel;
	state.resposta = null;
	console.log(pergunta+'\nOpções: '+opcoes+' ou NDA');
}

/*
	Processa a entrada do usuário
*/
function processa_entrada(str) {
	if (!state.variavel) return;
	if (typeof str === 'string')
		str = str.toLowerCase();
	if (parseInt(str) == str)
		str = parseInt(str);
	if (str == 'nda') {
		state.saidas = del_values(state.saidas, state.variavel, null);
	}
	else if (!(
		typeof str === 'number'
		&&
		base.intervalos.indexOf(state.variavel) >= 0
		&&
		str >= state.valores[state.variavel][0]
		&&
		str <= state.valores[state.variavel][state.valores[state.variavel].length-1]
		||
		base.valores[state.variavel].indexOf(str) >= 0
	)) {
		console.log('Opção inválida!');
		faz_pergunta(state.variavel, true);
		return;
	}
	else {
		state.saidas = del_values(state.saidas, state.variavel, str);
	}
	state.variaveis.splice(state.variaveis.indexOf(state.variavel),1);
	iterate();
}

/*
	Função que lê a entrada padrão
*/
if (!isBrowser())
process.openStdin().addListener("data", function(d) {
	processa_entrada(d.toString().trim());
});

processar(base);
if (!isBrowser()) {
	reset_state();
	iterate();
}
