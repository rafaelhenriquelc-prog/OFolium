# OFolium

O OFolium é uma aplicação desenvolvida para auxiliar microempreendedores na organização das informações de seus funcionários. O sistema busca substituir anotações em papel, mensagens dispersas e planilhas complexas por uma solução simples e centralizada.

## Situação atual

O OFolium encontra-se na Fase 02 de desenvolvimento, com integração funcional entre frontend e backend nas principais operações do sistema. A aplicação utiliza Supabase para autenticação, gerenciamento de sessões e persistência de dados em PostgreSQL. Atualmente, as contas reais permitem gerenciar funcionários e registrar movimentações de horas extras, faltas, vales, adicionais e descontos, enquanto o modo demonstração utiliza dados locais.

A versão web está publicada na Vercel e disponível para acesso e testes. 

Acesse a versão web:
https://o-folium.vercel.app/login

Funcionalidades

Cadastro, login, recuperação de senha e gerenciamento de sessão;

Cadastro e atualização dos dados da empresa;

Cadastro, consulta, edição, ativação e desativação de funcionários;

Registro de horas extras e faltas;

Registro de vales, adicionais e descontos;

Consulta ao histórico de movimentações cadastradas;

Visualização de indicadores e estimativas gerenciais;

Geração e download de relatórios gerenciais em PDF na versão web;

Modo demonstração com dados locais, separado das contas reais.

Funcionalidades em desenvolvimento ou parcialmente implementadas:

Fechamento mensal com persistência no banco de dados;

Revisão e reabertura de competências;

Notificações e alertas com persistência;

Histórico salarial na interface;

Edição e exclusão de movimentações pela interface;

Exportação de relatórios em Excel e CSV.

OFolium Pro

O OFolium Pro é uma proposta de plano para negócios que necessitam gerenciar equipes maiores e utilizar funcionalidades complementares. O sistema já possui estrutura para identificar o plano associado ao negócio.

Entre os recursos previstos para o plano Pro estão:

Gerenciamento de até 20 funcionários;

Fechamento mensal com preservação do histórico;

Histórico ampliado de movimentações;

Revisão mensal por funcionário;

Comparação de informações entre meses;

Relatórios gerenciais para apoio ao contador;

Exportação em PDF, Excel e CSV;

Alertas de pendências.

A disponibilidade desses recursos depende da conclusão das respectivas implementações.

Tecnologias utilizadas

React Native;

Expo;

Expo Router;

TypeScript;

Supabase Auth;

Supabase JavaScript Client;

PostgreSQL;

Row Level Security (RLS);

jsPDF;

jsPDF-AutoTable;

Git e GitHub;

Vercel.

Executando o projeto

Pré-requisitos

Node.js;

npm;

Expo.
