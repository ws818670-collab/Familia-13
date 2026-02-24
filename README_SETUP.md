# 🏆 Gestão de Clubes - Sistema de Gerenciamento

Sistema completo para gestão de clubes amadores com controle de jogadores, jogos, financeiro e mensalidades.

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Authentication, Realtime Database, Cloud Functions)
- **Hosting**: Firebase Hosting
- **Monitoramento**: Sentry (opcional)

## 📋 Pré-requisitos

- Node.js 18+ 
- Firebase CLI (`npm install -g firebase-tools`)
- Conta Firebase com projeto criado

## ⚙️ Configuração em Nova Máquina

### 1. Clonar o Repositório
```bash
git clone <seu-repo-url>
cd familia13-app
```

### 2. Instalar Dependências
```bash
npm install
cd functions
npm install
cd ..
```

### 3. Configurar Firebase
```bash
# Login no Firebase
firebase login

# Verificar projeto
firebase use --add

# Selecionar o projeto: familia-13-2aa28
```

### 4. Configurar Service Account (NÃO commitar!)
- Baixar `serviceAccountKey.json` do Firebase Console
- Colocar na raiz do projeto
- **NUNCA fazer commit deste arquivo!**

### 5. Deploy
```bash
# Deploy completo
firebase deploy

# Apenas hosting
firebase deploy --only hosting

# Apenas functions
firebase deploy --only functions
```

## 📁 Estrutura do Projeto

```
familia13-app/
├── app.js                 # Lógica principal do frontend
├── style.css              # Estilos
├── index.html             # Página principal
├── firebase.json          # Configuração Firebase
├── firebase.rules.json    # Regras de segurança (multitenant)
├── .firebaserc            # Projeto Firebase ativo
├── package.json           # Dependências do projeto
├── serviceAccountKey.json # ⚠️ NUNCA COMMITAR (apenas local)
├── functions/             # Cloud Functions
│   ├── index.js          # Funções serverless
│   └── package.json      # Dependências das functions
└── docs/                  # Documentação (opcional)
```

## 🔐 Segurança

- O arquivo `serviceAccountKey.json` está no `.gitignore`
- Backups de dados com timestamps não são commitados
- Firebase Rules implementadas com multitenant

## 🌐 URLs

- **Produção**: https://familia-13-2aa28.web.app
- **Console Firebase**: https://console.firebase.google.com/project/familia-13-2aa28

## 📦 Funcionalidades

### Módulos Principais
- ✅ **Autenticação**: Login, registro, recuperação de senha
- ✅ **Jogadores**: CRUD completo + controle de mensalidades
- ✅ **Jogos**: Agendamento e finalização com estatísticas
- ✅ **Financeiro**: Entradas, saídas e controle de caixa
- ✅ **Usuários**: Gestão de membros (Admin/Diretor/Jogador)
- ✅ **Logs**: Auditoria de ações
- ✅ **Multi-tenant**: Suporte a múltiplos clubes

### Roles (Permissões)
- 🔴 **Platform Admin**: Acesso total a todos os clubes
- 🟠 **Admin**: Gestão completa do clube
- 🟡 **Diretor**: Gerencia jogadores e jogos
- 🟢 **Jogador**: Visualização apenas

## 🔄 Workflow de Desenvolvimento

1. Fazer alterações no código
2. Testar localmente
3. Commit das mudanças
4. Deploy para produção

## 📝 Comandos Úteis

```bash
# Ver logs das functions
firebase functions:log

# Ver status do projeto
firebase projects:list

# Backup do Realtime Database
firebase database:get / > backup-$(date +%Y%m%d).json

# Limpar cache local
firebase hosting:channel:delete preview
```

## 🐛 Troubleshooting

### Erro de autenticação
```bash
firebase logout
firebase login
```

### Functions não funcionando
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Cache não atualiza
- Forçar refresh com Ctrl+Shift+R (PC) ou Cmd+Shift+R (Mac)
- Limpar cache do navegador

## 👥 Autores

Sistema desenvolvido para gestão de clubes amadores de futevólei.

## 📄 Licença

Privado - Todos os direitos reservados.
