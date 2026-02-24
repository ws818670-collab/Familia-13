# Sistema Multi-Tenant por Clube

## 🏗️ Arquitetura Implementada

O sistema agora possui **isolamento completo de dados por clube**, permitindo que múltiplos clubes usem a mesma aplicação com dados totalmente separados.

## 📊 Estrutura do Banco de Dados

### **Antes (Single-Tenant):**
```
/users/{uid}
/jogadores/{id}
/jogos/{id}
/financeiro/{id}
/logs/{id}
/categorias_financeiras/
```

### **Depois (Multi-Tenant):**
```
/clubs/{clubId}/
  ├── info/                    # Informações do clube
  ├── members/{uid}/           # Membros do clube (ex-users)
  ├── jogadores/{id}/          # Jogadores do clube
  ├── jogos/{id}/              # Jogos do clube
  ├── financeiro/{id}/         # Financeiro do clube
  ├── logs/{id}/               # Logs do clube
  └── categorias_financeiras/  # Categorias do clube

/userClubs/{uid}/
  └── {clubId}/                # Clubes do usuário
      ├── clubId
      ├── clubName
      └── joinedAt
```

## 🔐 Isolamento de Dados

- **Cada clube tem ID único**: `clubId` gerado pelo Firebase
- **Membros isolados**: Usuários só veem dados do seu clube
- **Rules rigorosas**: Firebase Rules garantem isolamento no servidor
- **Cache local**: clubId armazenado no localStorage

## 🚀 Componentes Implementados

### **1. ClubModule** (Novo)

Gerencia o isolamento por clube:

```javascript
// Inicializar clube do usuário
await ClubModule.init(uid);

// Criar novo clube
await ClubModule.createClub(clubName, creatorUid);

// Obter clube atual
const clubId = ClubModule.currentClubId;
const clubName = ClubModule.currentClubName;

// Limpar cache (logout)
ClubModule.clear();
```

### **2. dbRef() Helper** (Novo)

Cria referências ao banco automaticamente isoladas por clube:

```javascript
// ANTES (sem isolamento):
db.ref('jogadores').once('value');
db.ref('jogadores/' + id).set(data);

// DEPOIS (com isolamento):
dbRef('jogadores').once('value');
dbRef('jogadores/' + id).set(data);
```

**O que o helper faz:**
- Pega o `clubId` do `ClubModule.currentClubId`
- Adiciona prefixo: `clubs/{clubId}/`
- Retorna: `db.ref('clubs/{clubId}/jogadores')`

### **3. Firebase Rules Atualizado**

Todas as permissões agora verificam:
1. Usuário está autenticado
2. Usuário é membro do clube (`/clubs/{clubId}/members/{uid}` existe)
3. Usuário tem status 'approved'
4. Usuário tem role adequado (admin/diretor/jogador)

## 📝 Fluxo de Criação de Clube

### **1. Primeiro Login (Sem Clube)**
```
Login → ClubModule.init() retorna false
     → Mostra tela: "Bem-vindo! Crie um clube"
     → Usuário digita nome do clube
     → ClubModule.createClub()
     → Cria estrutura em /clubs/{clubId}
     → Adiciona usuário como admin em /clubs/{clubId}/members/{uid}
     → Registra em /userClubs/{uid}/{clubId}
     → Salva clubId no localStorage
     → Reload → Login completo
```

### **2. Próximos Logins (Com Clube)**
```
Login → ClubModule.init() 
     → Busca /userClubs/{uid}
     → Pega primeiro clube (ou último usado)
     → Carrega clubId e clubName
     → Salva no cache (localStorage)
     → AuthModule.loadUserData()
     → Busca /clubs/{clubId}/members/{uid}
     → Verifica status/role
     → Dashboard com dados isolados
```

## 🔄 Migração de Código

### **Padrão de Atualização:**

#### **ANTES:**
```javascript
db.ref('jogadores').once('value')
db.ref('jogadores/' + id).set(data)
db.ref('users/' + uid).once('value')
```

#### **DEPOIS:**
```javascript
dbRef('jogadores').once('value')
dbRef('jogadores/' + id).set(data)
dbRef('members/' + uid).once('value')  // users → members
```

### **Substituições Necessárias:**

1. `db.ref('jogadores'` → `dbRef('jogadores'`
2. `db.ref('jogos'` → `dbRef('jogos'`
3. `db.ref('financeiro'` → `dbRef('financeiro'`
4. `db.ref('categorias_financeiras'` → `dbRef('categorias_financeiras'`
5. `db.ref('logs'` → `dbRef('logs'`
6. `db.ref('users'` → `dbRef('members'`  ⚠️ Nome muda!

### **Exceções (NÃO usar dbRef):**

- `db.ref('userClubs')` - Dados globais do usuário
- `db.ref('clubs')` - Listagem de clubes (raro)
- Firebase Auth - Não usa Realtime Database

## 🎯 Benefícios do Multi-Tenant

| Aspecto | Benefício |
|---------|-----------|
| **Isolamento** | ✅ Dados completamente separados |
| **Segurança** | ✅ Rules garantem no servidor |
| **Escalabilidade** | ✅ Infinitos clubes no mesmo app |
| **Performance** | ✅ Apenas dados do clube carregados |
| **Manutenção** | ✅ Um código serve todos os clubes |
| **Custos** | ✅ Compartilha infraestrutura |

## 📦 Estrutura de um Clube

```json
{
  "clubs": {
    "ABC123": {
      "info": {
        "name": "Família 13",
        "createdAt": 1708214400000,
        "createdBy": "uid-do-criador"
      },
      "members": {
        "uid-usuario-1": {
          "login": "admin",
          "email": "admin@example.com",
          "nome": "Administrador",
          "role": "admin",
          "status": "approved",
          "joinedAt": 1708214400000
        },
        "uid-usuario-2": {
          "login": "diretor1",
          "email": "diretor@example.com",
          "nome": "Diretor",
          "role": "diretor",
          "status": "approved",
          "joinedAt": 1708214500000
        }
      },
      "jogadores": { },
      "jogos": { },
      "financeiro": { },
      "logs": { },
      "categorias_financeiras": { }
    }
  },
  "userClubs": {
    "uid-usuario-1": {
      "ABC123": {
        "clubId": "ABC123",
        "clubName": "Família 13",
        "joinedAt": 1708214400000
      }
    }
  }
}
```

## 🔧 Estado Atual da Implementação

### ✅ Implementado:
- [x] ClubModule com criação de clubes
- [x] dbRef() helper para isolamento automático
- [x] Firebase Rules multi-tenant (arquivo separado `firebase.rules.multitenant.json`)
- [x] Interface de criação de clube
- [x] Cache de clubId no localStorage
- [x] AuthModule atualizado (registro, loadUserData, logout)
- [x] LogsModule refatorado (todas as referências)
- [x] UserManagementModule refatorado (users → members)
- [x] JogadoresModule refatorado (todas as referências)
- [x] JogosModule refatorado (jogos + gols/assistências)
- [x] CategoriasModule refatorado (categorias_financeiras)
- [x] FinanceiroModule refatorado (financeiro)
- [x] MenuModule refatorado (dashboard queries)

### ⏳ Pendente (Próxima Fase):
- [ ] Testar isolamento completo entre clubes
- [ ] Deploy do firebase.rules.multitenant.json → firebase.rules.json
- [ ] Deploy do app.js atualizado
- [ ] Interface para trocar de clube (se usuário tiver múltiplos)
- [ ] Convite para adicionar membros ao clube
- [ ] Script de migração de dados existentes

## 🚨 Atenção para Desenvolvimento

### **Ao adicionar novo código:**

1. **SEMPRE use `dbRef()`** em vez de `db.ref()` para dados do clube
2. **NUNCA use `db.ref('users')`** - use `dbRef('members')`
3. **Teste com múltiplos clubes** para garantir isolamento
4. **Verifique as Rules** antes de deploy

### **Exemplo de código novo correto:**

```javascript
// ✅ CORRETO
async function savePlayer(playerData) {
  const id = dbRef('jogadores').push().key;
  await dbRef(`jogadores/${id}`).set(playerData);
}

// ❌ ERRADO
async function savePlayer(playerData) {
  const id = db.ref('jogadores').push().key;
  await db.ref(`jogadores/${id}`).set(playerData);
}
```

## 📝 Próximos Passos

1. **Testar criação de clube** em produção
2. **Migrar código existente** progressivamente
3. **Adicionar gerenciamento de membros** (convites)
4. **Interface multi-clube** (se usuário pertence a vários)
5. **Dashboard de admin** para ver todos os clubes

## 🎓 Conclusão

O sistema multi-tenant está **estruturado e funcional** na camada de isolamento. A migração completa do código requer atualização de todas as referências `db.ref()` para `dbRef()`, mas a arquitetura base está sólida e segura.

**Status:** ✅ Infraestrutura pronta | ⏳ Migração de código em andamento
