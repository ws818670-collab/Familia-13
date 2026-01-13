# 🚀 Guia de Deploy - Família 13

## Pré-requisitos

- Node.js 12+ instalado
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Conta Google ativa
- Projeto Firebase já criado

## Instalação Local

### 1. Clonar/Acessar o Projeto
```bash
cd c:\Meus-Projetos\familia13-app
```

### 2. Instalar Firebase CLI (se não tiver)
```bash
npm install -g firebase-tools
```

### 3. Login no Firebase
```bash
firebase login
```

### 4. Inicializar Projeto (primeira vez)
```bash
firebase init
```

Selecione:
- Hosting: Yes
- Project: familia-13-2aa28
- Public directory: . (ponto)
- Single page app: Yes
- Overwrite: No

## Teste Local

### 1. Abrir com Live Server
Se usar VS Code:
- Instale extensão "Live Server"
- Clique direito em `index.html` > "Open with Live Server"
- Acessar em `http://localhost:5500`

Ou use Python:
```bash
python -m http.server 8000
```
Acesse `http://localhost:8000`

## Deploy para Produção

### 1. Verificar Arquivos
```bash
firebase list
```

### 2. Deploy
```bash
firebase deploy
```

### 3. Acessar
- URL: `https://familia-13-2aa28.web.app`

## Estrutura de Deploy

```
familia13-app/
├── index.html          ✅ Hospedado
├── style.css           ✅ Hospedado
├── app.js              ✅ Hospedado
├── firebase.json       ⚙️ Configuração
├── .firebaserc          ⚙️ Configuração
├── .firebase/          ⚙️ Cache local
├── README.md           📝 Documentação
├── CHANGELOG.md        📝 Changelog
└── public/             📁 Pasta pública
```

## Configurações Firebase

### Regras de Segurança (Realtime Database)
```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "jogadores": {
      ".indexOn": ["id", "nome"],
      "$uid": {
        ".validate": "newData.hasChildren(['id', 'nome', 'posicao'])"
      }
    },
    "jogos": {
      ".indexOn": ["id", "data"],
      "$uid": {
        ".validate": "newData.hasChildren(['id', 'data', 'adversario'])"
      }
    },
    "financeiro": {
      ".indexOn": ["id", "tipo"],
      "$uid": {
        ".validate": "newData.hasChildren(['id', 'tipo', 'valor'])"
      }
    }
  }
}
```

### Hosting (firebase.json)
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Troubleshooting

### Erro: "Cannot find module 'firebase'"
```bash
npm install firebase
```

### Erro: 404 ao acessar app
- Verificar se `firebase.json` está correto
- Verificar se arquivos estão no diretório correto
- Fazer deploy novamente: `firebase deploy --force`

### Dados não salvam
- Verificar console browser (F12)
- Verificar Firebase Realtime Database
- Verificar regras de segurança do Firebase
- Testar autenticação

### Performance lenta
- Verificar bandwidth disponível
- Usar DevTools Network tab
- Comprimir imagens se houver
- Minificar CSS/JS se necessário

## Monitoramento

### Firebase Console
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Selecione "familia-13-2aa28"
3. Veja:
   - **Realtime Database**: Dados em tempo real
   - **Hosting**: Logs de deploy
   - **Analytics**: Uso do app

### DevTools Browser
- F12 > Network: Ver requisições
- F12 > Console: Ver erros
- F12 > Application: Ver dados armazenados
- F12 > Performance: Analisar performance

## Atualizações

### Como Fazer Deploy de Atualizações
1. Editar arquivos (HTML, CSS, JS)
2. Testar localmente
3. Executar: `firebase deploy`
4. App atualiza automaticamente

### Versionamento
- Manter histórico em CHANGELOG.md
- Usar tags Git para releases
- Documentar breaking changes

## Backup

### Exportar Dados Firebase
```bash
firebase database:get / > backup.json
```

### Restaurar Dados Firebase
```bash
firebase database:set / < backup.json
```

## Segurança

### Recomendações
- ✅ Usar HTTPS (Firebase fornece)
- ✅ Validar entrada de dados
- ✅ Limpar dados sensíveis regularmente
- ✅ Fazer backup regularmente
- ✅ Monitorar console Firebase
- ⚠️ Implementar autenticação quando necessário

## URLs Importantes

- **App**: https://familia-13-2aa28.web.app
- **Console Firebase**: https://console.firebase.google.com/project/familia-13-2aa28
- **Realtime Database**: https://console.firebase.google.com/project/familia-13-2aa28/database
- **Hosting**: https://console.firebase.google.com/project/familia-13-2aa28/hosting

## Suporte

Para problemas:
1. Verificar Console Firebase
2. Ler documentação oficial Firebase
3. Consultar stack overflow
4. Contatar desenvolvedor

---

**Deploy feito com ❤️**
