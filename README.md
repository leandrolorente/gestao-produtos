# 📦 Sistema de Gestão de Produtos

> **Sistema completo de gestão de estoque e vendas desenvolvido em Angular 20+ com Material Design**

[![Angular](https://img.shields.io/badge/Angular-20.3.2-DD0031?style=flat&logo=angular)](https://angular.io/)
[![Material Design](https://img.shields.io/badge/Material_Design-20.2.5-0081CB?style=flat&logo=material-design)](https://material.angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

## 🚀 Características Principais

### 📋 **Gestão de Produtos**
- ✅ CRUD completo de produtos
- ✅ Controle de estoque com alertas de baixo estoque
- ✅ Sistema de SKU automático
- ✅ Categorização e organização
- ✅ Scanner de código de barras integrado

### 👥 **Gestão de Clientes**
- ✅ Cadastro completo de clientes (PF/PJ)
- ✅ Histórico de compras
- ✅ Validação de CPF/CNPJ
- ✅ Controle de status (ativo/inativo)

### 💰 **Sistema de Vendas**
- ✅ Processo de venda com fluxo completo (Rascunho → Confirmada → Finalizada)
- ✅ Múltiplas formas de pagamento
- ✅ Cálculo automático de totais e descontos
- ✅ Sistema de duplo clique para edição
- ✅ Menu de contexto (botão direito)
- ✅ Diálogos de confirmação customizados

### 📊 **Dashboard e Relatórios**
- ✅ Estatísticas em tempo real
- ✅ Gráficos e indicadores visuais
- ✅ Top produtos mais vendidos
- ✅ Vendas recentes
- ✅ Ações rápidas para operações frequentes

### 🎨 **Interface e Experiência**
- ✅ Design responsivo e moderno
- ✅ Tema Material Design customizado
- ✅ Animações e transições suaves
- ✅ Suporte completo a mobile
- ✅ Componentes standalone (Angular 20+)
- ✅ Detecção de mudanças sem zona (zoneless)

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Angular 20.3.2** - Framework principal com componentes standalone
- **Angular Material 20.2.5** - Biblioteca de componentes UI
- **RxJS 7.8.0** - Programação reativa
- **TypeScript** - Linguagem de programação
- **SCSS** - Pré-processador CSS

### **Ferramentas de Desenvolvimento**
- **Angular CLI 20.3.3** - Interface de linha de comando
- **Prettier** - Formatação de código
- **ESLint** - Análise estática de código
- **Karma & Jasmine** - Testes unitários

### **Recursos Especiais**
- **@zxing/ngx-scanner** - Scanner de código de barras
- **Angular SSR** - Renderização no servidor
- **Express.js** - Servidor para SSR
- **Signals** - Sistema reativo nativo do Angular

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 18.19.0 (recomendado: versão LTS mais recente)
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git** para controle de versão

### Verificar versões instaladas:
```bash
node --version
npm --version
git --version
```

## 🚀 Instalação e Configuração

### 1️⃣ **Clone o Repositório**
```bash
git clone https://github.com/leandrolorente/gestao-produtos.git
cd gestao-produtos
```

### 2️⃣ **Instale as Dependências**
```bash
# Usando npm
npm install

# Ou usando yarn
yarn install
```

### 3️⃣ **Configure o Ambiente**
```bash
# Copie o arquivo de configuração de exemplo
cp src/environments/environment.example.ts src/environments/environment.ts

# Edite as configurações conforme necessário
# - URLs da API
# - Chaves de configuração
# - Configurações de ambiente
```

### 4️⃣ **Inicie o Servidor de Desenvolvimento**
```bash
# Usando npm
npm start

# Ou usando yarn
yarn start

# Ou diretamente com Angular CLI
ng serve
```

A aplicação estará disponível em: **http://localhost:4200**

## 📁 Estrutura do Projeto

```
gestao-produtos/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 components/          # Componentes reutilizáveis
│   │   │   ├── 📁 client-dialog/
│   │   │   ├── 📁 confirmation-dialog/
│   │   │   ├── 📁 product-dialog/
│   │   │   └── 📁 venda-dialog/
│   │   ├── 📁 models/              # Interfaces e tipos TypeScript
│   │   │   ├── 📄 Cliente.ts
│   │   │   ├── 📄 Product.ts
│   │   │   └── 📄 Venda.ts
│   │   ├── 📁 pages/               # Páginas principais
│   │   │   ├── 📁 clients/
│   │   │   ├── 📁 dashboard/
│   │   │   ├── 📁 products/
│   │   │   └── 📁 vendas/
│   │   ├── 📁 services/            # Serviços e lógica de negócio
│   │   │   ├── 📄 auth.service.ts
│   │   │   ├── 📄 client.service.ts
│   │   │   ├── 📄 confirmation-dialog.service.ts
│   │   │   └── 📄 venda.service.ts
│   │   └── 📁 shared/              # Recursos compartilhados
│   ├── 📁 assets/                  # Recursos estáticos
│   ├── 📁 environments/            # Configurações de ambiente
│   └── 📄 styles.scss              # Estilos globais
├── 📄 angular.json                 # Configuração do Angular
├── 📄 package.json                 # Dependências e scripts
├── 📄 tsconfig.json               # Configuração TypeScript
└── 📄 README.md                   # Este arquivo
```

## 🔧 Scripts Disponíveis

### **Desenvolvimento**
```bash
npm start                    # Inicia servidor de desenvolvimento
npm run watch               # Build com watch mode
```

### **Build e Deploy**
```bash
npm run build              # Build para produção
npm run build:dev          # Build para desenvolvimento
npm run serve:ssr          # Servidor SSR em produção
```

### **Testes**
```bash
npm test                   # Executa testes unitários
npm run test:coverage      # Testes com cobertura de código
npm run e2e               # Testes end-to-end (se configurado)
```

### **Código**
```bash
npm run lint              # Análise de código com ESLint
npm run format            # Formatação com Prettier
```

## 🏗️ Arquitetura do Sistema

### **Padrões Arquiteturais**
- **Componentes Standalone** - Sem NgModules, imports explícitos
- **Signal-based State** - Sistema reativo com Angular Signals
- **Reactive Forms** - Formulários reativos com validações
- **Services Pattern** - Separação de responsabilidades
- **Observer Pattern** - Comunicação via observables

### **Fluxo de Dados**
```
API ← → Services ← → Components ← → Templates
                ↓
            Local Storage / Cache
```

### **Principais Serviços**
- **VendaService** - Gestão completa de vendas
- **ClientService** - Operações com clientes
- **AuthService** - Autenticação e autorização
- **ConfirmationDialogService** - Diálogos de confirmação

## 🎨 Sistema de Design

### **Tema Customizado**
```scss
// Cores principais
--primary-color: #667eea
--primary-dark: #5a6fd8
--secondary-color: #764ba2

// Gradientes
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--success-gradient: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)
```

### **Breakpoints Responsivos**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Funcionalidades de Segurança

- ✅ Autenticação JWT
- ✅ Guards de rota
- ✅ Validação de permissões
- ✅ Sanitização de dados
- ✅ Headers de segurança

## 📱 Funcionalidades Avançadas

### **Gestão de Vendas**
- **Double-click para edição** - Duplo clique na linha para editar
- **Menu de contexto** - Botão direito para ações rápidas
- **Fluxo de estados** - Pendente → Confirmada → Finalizada
- **Validações de negócio** - Regras específicas por status

### **Interface Intuitiva**
- **Diálogos de confirmação** - Ações críticas com confirmação
- **Feedback visual** - Animações e indicadores de estado
- **Formatação automática** - Datas, moedas e dados complexos
- **Pesquisa em tempo real** - Filtros dinâmicos

## 🐛 Solução de Problemas

### **Erros Comuns**

**Erro de porta em uso:**
```bash
# Matar processo na porta 4200
npx kill-port 4200
npm start
```

**Problemas de cache:**
```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Problemas de TypeScript:**
```bash
# Verificar configuração
npx tsc --noEmit

# Verificar versões
ng version
```

## 🤝 Contribuindo

1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie uma branch** para sua feature (`git checkout -b feature/amazing-feature`)
4. **Commit** suas mudanças (`git commit -m 'Add amazing feature'`)
5. **Push** para a branch (`git push origin feature/amazing-feature`)
6. **Abra um Pull Request**

### **Convenções de Código**
- Siga o guia de estilo do Angular
- Use Prettier para formatação
- Escreva commits descritivos
- Adicione testes para novas funcionalidades

## 📜 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Leandro Lorente**
- GitHub: [@leandrolorente](https://github.com/leandrolorente)
- Email: leandrolorente250@gmail.com

---

## 📚 Recursos Adicionais

- [Documentação do Angular](https://angular.dev/)
- [Angular Material](https://material.angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

⭐ **Se este projeto te ajudou, não esqueça de dar uma estrela!**
