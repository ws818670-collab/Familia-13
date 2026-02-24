# Sistema de Controle de Roles - Família 13

## 📋 Roles Disponíveis

### 1. **ADMIN** (Administrador)
- **Descrição**: Acesso total ao sistema
- **Permissões**:
  - ✅ Ler todos os dados
  - ✅ Escrever em todas as seções
  - ✅ Gerenciar usuários (aprovar/rejeitar)
  - ✅ Acessar logs
  - ✅ Gerenciar categorias financeiras
  - ✅ Editar dados de jogadores, jogos e finanças

### 2. **DIRETOR** (Diretor)
- **Descrição**: Gerencia operações do time
- **Permissões**:
  - ✅ Ler: Jogadores, Jogos, Finanças
  - ✅ Escrever: Jogadores, Jogos
  - ❌ Não pode: Gerenciar usuários, Acessar logs, Editar finanças
  - ❌ Não pode: Gerenciar categorias financeiras

### 3. **JOGADOR** (Jogador)
- **Descrição**: Membro do time com acesso limitado
- **Permissões**:
  - ✅ Ler: Jogadores (lista do time), Jogos (cronograma)
  - ❌ Não pode: Escrever em nenhuma seção
  - ❌ Não pode: Acessar Finanças
  - ❌ Não pode: Acessar Logs

---

## 🔐 Matriz de Permissões

| Seção | Admin | Diretor | Jogador |
|-------|-------|---------|---------|
| **Jogadores** | ✅ L/E | ✅ L/E | ✅ L |
| **Jogos** | ✅ L/E | ✅ L/E | ✅ L |
| **Finanças** | ✅ L/E | ❌ - | ❌ - |
| **Categorias** | ✅ L/E | ❌ - | ❌ - |
| **Logs** | ✅ L | ❌ - | ❌ - |
| **Usuários** | ✅ L/E | ❌ - | ❌ - |

**L** = Leitura | **E** = Escrita

---

## 🛡️ Implementação no Firebase

### Regras de Segurança (firebase.rules.json)

As regras foram configuradas para:

1. **Bloquear acesso não autorizado**: Só usuários autenticados e aprovados podem acessar
2. **Impedir escrita de leitura**: Usuários com role 'jogador' podem apenas ler
3. **Restringir finanças**: Só admin pode modificar dados financeiros
4. **Proteger logs**: Só admin pode ler logs

### Exemplo de Regra de Leitura (Jogadores)
```
".read": "auth != null && root.child('users').child(auth.uid).child('status').val() === 'approved'"
```

### Exemplo de Regra de Escrita (Finanças)
```
".write": "auth != null && root.child('users').child(auth.uid).child('status').val() === 'approved' && root.child('users').child(auth.uid).child('role').val() === 'admin'"
```

---

## 💻 Métodos de Verificação no JavaScript

O módulo `AuthModule` fornece métodos helpers para verificar permissões:

```javascript
// Verificar se pode ler uma seção
if (AuthModule.canRead('jogadores')) {
  // Carregar dados de jogadores
}

// Verificar se pode escrever uma seção
if (AuthModule.canWrite('jogos')) {
  // Permitir editar jogo
} else {
  UI.showToast('Sem permissão para editar jogos', 'warning');
}

// Verificar se é admin
if (AuthModule.isAdmin()) {
  // Mostrar opções de admin
}

// Verificar se é diretor (diretor ou admin)
if (AuthModule.isDiretor()) {
  // Mostrar opções de gerenciamento
}

// Verificar se usuário está aprovado
if (AuthModule.isApproved()) {
  // Usar dados do usuário
}
```

---

## 📝 Alterando Roles de Usuários

### Via Firebase Console:
1. Vá para **Realtime Database** → `users`
2. Selecione o usuário
3. Modifique o campo `role` para um dos valores:
   - `admin`
   - `diretor`
   - `jogador`

### Via Código JavaScript (requer autenticação como admin):
```javascript
const uid = 'user-uid-aqui';
db.ref('users/' + uid).update({
  role: 'diretor'  // ou 'admin', 'jogador'
}).then(() => {
  console.log('Role atualizado');
});
```

---

## ⚠️ Notas de Segurança

1. **Validação Dupla**: As permissões são validadas tanto no cliente quanto no servidor (Firebase Rules)
2. **Status Aprovado**: Todos os dados requerem `status: 'approved'` além do role correto
3. **Não confie apenas no cliente**: As regras do Firebase são a fonte de verdade
4. **Logs**: Todas as ações são registradas para auditoria (apenas admin pode ver)

---

## 🔄 Fluxo de Aprovação

1. Novo usuário se registra → `status: 'pending'`, `role: 'jogador'`
2. Admin aprova → `status: 'approved'`
3. Admin promove se necessário → `role: 'diretor'` ou `role: 'admin'`
4. Usuário pode fazer login e acessar conforme seu role

---

## 📊 Status Possíveis

- `pending`: Aguardando aprovação do admin
- `approved`: Usuário pode fazer login e acessar dados conforme role
- `rejected`: Acesso negado permanentemente

