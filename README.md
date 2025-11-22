# Stocks Manager v2

Permite acompanhar investimentos financeiros de forma simples.

## Como Executar

### Pré-requisitos
- Node.js v18.19 ou superior (recomendado v24+)
- npm 9.0 ou superior

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
# Usando o script personalizado (recomendado)
./run-dev.sh

# Ou usando npm diretamente
npm start
```

A aplicação estará disponível em `http://localhost:4200`

### Build de Produção
```bash
npm run build
```

Os arquivos compilados estarão em `dist/stock-manager-v2`

## Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Tela inicial com visão geral
│   │   ├── investments-list/   # Lista de investimentos
│   │   ├── investment-detail/  # Detalhes e movimentações
│   │   └── settings/           # Configurações e backup
│   ├── models/                 # Modelos de dados TypeScript
│   ├── services/              # Serviços (storage, cálculos, etc)
│   └── app.component.ts       # Componente raiz com navegação
```

## Funcionalidades Implementadas

- ✅ 4 telas principais (Dashboard, Lista de Investimentos, Detalhes, Configurações)
- ✅ Suporte a todos os tipos de investimento (Renda Fixa, Variável, Fundos, Câmbio)
- ✅ Armazenamento local (LocalStorage)
- ✅ Sistema de backup criptografado com senha
- ✅ Suporte multi-moeda (BRL, USD, EUR)
- ✅ Cálculo de rentabilidade
- ✅ Gestão de transações (aportes, saques, atualizações)
- ✅ Interface responsiva com Angular Material

## Requisitos Técnicos

| TR | Descrição |
| --- | --- |
| TR001 | Utiliza o framework Angular para criar um web site estático |
| TR002 | Não depende de banco de dados: os dados são armazenados no local storage do navegador |
| TR003 | A aplicação deve concentrar funcionalidades no menor número de telas |

## Requisitos Funcionais

| FR | Descrição |
| --- | --- |
| FR001 | A aplicação suporta os seguintes tipos de investimento: Renda Fixa (Previdência, Tesouro, CDB, LCI/LCA, Debêntures e letras de câmbio), Renda Variável (Ações, ETFs, Fundo de Ações, BDRs, Criptomoedas), Fundos de Investimento (DI, Multimercado, Cambiais, FII), Câmbio e Moedas Estrangeiras (Dólar, Fundos Cambiais, ETFs internacionais, REITs) |
| FR002 | A aplicação permite exportar e restaurar backup dos dados. O arquivo exportado deve ser criptografado e protegido por senha |
| FR003 | A aplicação permite o cadastramento de bancos e corretoras |
| FR004 | A aplicação permite o cadastramento de investimentos com o nome, banco/corretora, tipo (FR001), a data inicial da compra, valor inicial e um campo livre de comentários |
| FR005 | A aplicação permite atualizar o desenvolvimento do investimento, permitindo lançar, de forma tabular, eventos de aporte, saque e atualização de saldo |
| FR006 | A aplicação deve permitir a configuração da moeda principal |
| FR007 | Todos os valores devem sempre ser reportados na moeda principal pela cotação do dia. Caso o investimento seja em outra moeda, apresentar seu valor entre parênteses ao lado do valor na moeda principal |
| FR008 | O cálculo de rentabilidade deve ser feito com base no valor inicial, aportes e saques e saldo final no período |
| FR009 | A tela do investimento deve trazer o gráfico de rentabilidade por período (ano corrente, ano anterior, 5 anos, desde o início) e a movimentação (aportes, saques e saldo) como uma tabela similar a um extrato de conta corrente |
| FR010 | A tela do investimento deve permitir o lançamento de atualizações (FR005) de forma tabular, facilitando a entrada de dados em lote |
| FR011 | A tela inicial deve trazer o saldo e rentabilidade atualizados e um gráfico com a rentabilidade consolidada por tipo dos investimentos e uma breve lista de aportes e saques no ano corrente |
| FR012 | Os gráficos de rentabilidade devem permitir a comparação com CDI, dólar e Ibovespa. A comparação não deve ser anterior à aquisição do título e deve parar na última atualização de saldo |
| FR013 | O sistema deve ter 4 telas: "inicial", "lista de investimento", "investimento" (gráfico e atualizações) e a tela de "configurações e backup" |
| FR014 | Na tela de investimentos, permitir a ordenação e filtro da tabela para os campos Nome, Banco, Tipo, Saldo e Rentabilidade |
| FR015 | Na tela de investimentos, permitir a seleção do período de rentabilidade: ano corrente, 12 meses ou ano anterior |
| FR016 | Na tela de detalhes do investimento, permitir a seleção do período de rentabilidade: ano corrente, 12 meses ou ano anterior |
| FR017 | Na tela de detalhes, na tabela de histórico de movimentações, permitir também alteração de um registro |
