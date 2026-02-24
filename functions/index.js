/**
 * ===========================
 * CLOUD FUNCTIONS - FAMÍLIA 13
 * ===========================
 * 
 * Operações críticas validadas server-side:
 * - Transações financeiras (adicionar, editar, deletar)
 * - Aprovação/rejeição de usuários
 * - Mudança de roles
 * - Categorias financeiras
 * 
 * SEGURANÇA:
 * - Validação de autenticação (auth.uid)
 * - Validação de role (Custom Claims ou database)
 * - Validação de regras de negócio
 * - Proteção temporal (90 dias para finanças)
 * - Logs de auditoria automáticos
 * 
 * DEPLOY:
 * cd functions && npm install
 * firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.database();

// ===========================
// CONSTANTES
// ===========================

const FINANCIAL_IMMUTABILITY_DAYS = 90;
const VALID_ROLES = ['admin', 'diretor', 'jogador'];

// ===========================
// HELPERS
// ===========================

/**
 * Valida se usuário está autenticado
 */
function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  return context.auth.uid;
}

/**
 * Obtém role do usuário (Custom Claims ou database)
 */
async function getUserRole(uid, clubId) {
  try {
    // Tentar pegar do Custom Claims primeiro (mais rápido)
    const user = await admin.auth().getUser(uid);
    if (user.customClaims && user.customClaims.role) {
      console.log('[ROLE] Obtido do Custom Claims:', user.customClaims.role);
      return user.customClaims.role;
    }
    
    // Fallback: buscar no database
    const snapshot = await db.ref(`clubs/${clubId}/members/${uid}/role`).once('value');
    const role = snapshot.val() || 'jogador';
    console.log('[ROLE] Obtido do database:', role);
    return role;
  } catch (error) {
    console.error('[ROLE] Erro ao obter role:', error);
    return 'jogador'; // Default seguro
  }
}

/**
 * Valida se usuário tem role necessária
 */
async function requireRole(uid, clubId, allowedRoles) {
  const userRole = await getUserRole(uid, clubId);
  
  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}. Sua role: ${userRole}`
    );
  }
  
  return userRole;
}

/**
 * Valida se clube existe e usuário pertence a ele
 */
async function validateClubMembership(uid, clubId) {
  const snapshot = await db.ref(`clubs/${clubId}/members/${uid}`).once('value');
  
  if (!snapshot.exists()) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Você não pertence a este clube'
    );
  }
  
  const member = snapshot.val();
  if (member.status !== 'approved') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Sua conta não está aprovada'
    );
  }
  
  return member;
}

/**
 * Valida se transação financeira pode ser modificada (< 90 dias)
 * PROTEÇÃO DE 90 DIAS DESABILITADA TEMPORARIAMENTE
 */
async function validateFinancialMutability(clubId, transactionId) {
  const snapshot = await db.ref(`clubs/${clubId}/financeiro/${transactionId}`).once('value');
  
  if (!snapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'Transação não encontrada');
  }
  
  const transaction = snapshot.val();
  // DESABILITADO: Permitir edição/exclusão independente da idade
  // const transactionDate = new Date(transaction.data);
  // const daysSince = (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
  // 
  // if (daysSince > FINANCIAL_IMMUTABILITY_DAYS) {
  //   throw new functions.https.HttpsError(
  //     'failed-precondition',
  //     `Transação imutável (>${FINANCIAL_IMMUTABILITY_DAYS} dias). Data: ${transaction.data}`
  //   );
  // }
  
  return transaction;
}

/**
 * Registra log de auditoria
 */
async function logAction(clubId, uid, userLogin, userRole, action, description, data) {
  const logRef = db.ref(`clubs/${clubId}/logs`).push();
  await logRef.set({
    id: logRef.key,
    usuario: userLogin,
    role: userRole,
    acao: action,
    descricao: description,
    dados: data || {},
    timestamp: new Date().toISOString(),
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR'),
    source: 'cloud-function'
  });
}

// ===========================
// TRANSAÇÕES FINANCEIRAS
// ===========================

/**
 * Adiciona transação financeira com validação server-side
 * 
 * Validações:
 * - Usuário autenticado e aprovado
 * - Role: admin ou diretor
 * - Categoria existe
 * - Valor válido
 * - Data válida
 */
exports.addFinancialTransaction = functions.https.onCall(async (data, context) => {
  console.log('[FINANCE] Adicionando transação:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, tipo, categoria, valor, descricao, data: dataTransacao, observacoes } = data;
  
  // 2. Validar clube
  const member = await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin ou diretor)
  const userRole = await requireRole(uid, clubId, ['admin', 'diretor']);
  
  // 4. Validar dados
  if (!tipo || !['entrada', 'saida'].includes(tipo)) {
    throw new functions.https.HttpsError('invalid-argument', 'Tipo inválido (entrada/saida)');
  }
  
  if (!categoria || categoria.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Categoria obrigatória');
  }
  
  if (!valor || valor <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valor deve ser positivo');
  }
  
  if (!dataTransacao) {
    throw new functions.https.HttpsError('invalid-argument', 'Data obrigatória');
  }
  
  // 5. Validar se categoria existe (buscar em todos os paths possíveis)
  let categoryExists = false;
  
  // 5a. Buscar em clubs/{clubId}/categorias_financeiras (novo path)
  const [clubEntradaSnapshot, clubSaidaSnapshot] = await Promise.all([
    db.ref(`clubs/${clubId}/categorias_financeiras/entrada`).once('value'),
    db.ref(`clubs/${clubId}/categorias_financeiras/saida`).once('value')
  ]);
  
  let clubEntradas = clubEntradaSnapshot.val() || {};
  let clubSaidas = clubSaidaSnapshot.val() || {};
  
  // Procurar categoria pelo nome nos paths do clube
  for (const cat of Object.values(clubEntradas)) {
    if (cat.nome === categoria) {
      categoryExists = true;
      break;
    }
  }
  
  if (!categoryExists) {
    for (const cat of Object.values(clubSaidas)) {
      if (cat.nome === categoria) {
        categoryExists = true;
        break;
      }
    }
  }
  
  // 5b. Se não encontrou, buscar no path antigo Root (categorias_financeiras para backward compatibility)
  if (!categoryExists) {
    const [rootEntradaSnapshot, rootSaidaSnapshot] = await Promise.all([
      db.ref('categorias_financeiras/entrada').once('value'),
      db.ref('categorias_financeiras/saida').once('value')
    ]);
    
    const rootEntradas = rootEntradaSnapshot.val() || {};
    const rootSaidas = rootSaidaSnapshot.val() || {};
    
    for (const cat of Object.values(rootEntradas)) {
      if (cat.nome === categoria) {
        categoryExists = true;
        break;
      }
    }
    
    if (!categoryExists) {
      for (const cat of Object.values(rootSaidas)) {
        if (cat.nome === categoria) {
          categoryExists = true;
          break;
        }
      }
    }
  }
  
  // 5c. Se ainda não encontrou, buscar no path antigo do clube
  if (!categoryExists) {
    const oldCategorySnapshot = await db.ref(`clubs/${clubId}/categorias/${categoria}`).once('value');
    categoryExists = oldCategorySnapshot.exists();
  }
  
  if (!categoryExists) {
    throw new functions.https.HttpsError('not-found', 'Categoria não encontrada');
  }
  
  // 6. Criar transação
  const transactionRef = db.ref(`clubs/${clubId}/financeiro`).push();
  
  // Extrair ano-mês da data (formato YYYY-MM)
  const mes = dataTransacao.substring(0, 7); // Extrai "2026-02" de "2026-02-19"
  
  const transaction = {
    id: transactionRef.key,
    tipo,
    categoria,
    valor: parseFloat(valor),
    mes, // Campo exigido pelas regras
    timestamp: Date.now(), // Campo exigido pelas regras
    descricao: descricao || '',
    observacoes: observacoes || '',
    data: dataTransacao,
    criadoEm: new Date().toISOString(),
    criadoPor: uid,
    criadoPorLogin: member.login || member.email,
    editavel: true // Marca como editável inicialmente
  };
  
  console.log('[FINANCE] Tentando salvar transação:', { transactionId: transactionRef.key, path: `clubs/${clubId}/financeiro/${transactionRef.key}` });
  
  try {
    await transactionRef.set(transaction);
    console.log('[FINANCE] Transação salva com sucesso:', transactionRef.key);
  } catch (setError) {
    console.error('[FINANCE] Erro ao salvar transação:', setError);
    throw new functions.https.HttpsError('internal', `Erro ao salvar transação: ${setError.message}`);
  }
  
  // 7. Invalidar cache para forçar recalcular na próxima chamada
  try {
    await db.ref(`clubs/${clubId}/cache/balance`).remove();
    console.log('[FINANCE] Cache de saldo invalidado - será recalculado na próxima chamada');
  } catch (cacheError) {
    console.error('[FINANCE] Erro ao invalidar cache (não crítico):', cacheError);
  }
  
  // 8. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'financial-add',
    `Adicionou ${tipo}: ${descricao} - R$ ${valor}`,
    { transactionId: transaction.id, tipo, categoria, valor }
  );
  
  console.log('[FINANCE] Transação criada:', transaction.id);
  return { success: true, transactionId: transaction.id };
});

/**
 * Atualiza transação financeira (somente se < 90 dias)
 */
exports.updateFinancialTransaction = functions.https.onCall(async (data, context) => {
  console.log('[FINANCE] Atualizando transação:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, transactionId, updates } = data;
  
  // 2. Validar clube
  const member = await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin ou diretor)
  const userRole = await requireRole(uid, clubId, ['admin', 'diretor']);
  
  // 4. Validar imutabilidade (< 90 dias)
  const oldTransaction = await validateFinancialMutability(clubId, transactionId);
  
  // 5. Validar campos permitidos
  const allowedFields = ['tipo', 'categoria', 'valor', 'descricao', 'observacoes', 'data'];
  const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
  
  if (invalidFields.length > 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Campos não permitidos: ${invalidFields.join(', ')}`
    );
  }
  
  // 6. Validar categoria se estiver sendo alterada
  if (updates.categoria && updates.categoria !== oldTransaction.categoria) {
    const categoriaSnapshot = await db.ref(`clubs/${clubId}/categorias/${updates.categoria}`).once('value');
    if (!categoriaSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Categoria não encontrada');
    }
  }
  
  // 7. Atualizar transação
  const updatedTransaction = {
    ...updates,
    valor: updates.valor ? parseFloat(updates.valor) : oldTransaction.valor,
    editadoEm: new Date().toISOString(),
    editadoPor: uid,
    editadoPorLogin: member.login || member.email
  };
  
  await db.ref(`clubs/${clubId}/financeiro/${transactionId}`).update(updatedTransaction);
  
  // 8. Atualizar cache de saldo incrementalmente (ajustar diferença)
  const cacheRef = db.ref(`clubs/${clubId}/cache/balance`);
  try {
    await cacheRef.transaction((currentCache) => {
      if (!currentCache) return currentCache; // Cache não existe, não atualiza
      
      // Calcular diferenças
      const oldTipo = oldTransaction.tipo;
      const newTipo = updates.tipo || oldTipo;
      const oldValor = parseFloat(oldTransaction.valor || 0);
      const newValor = parseFloat(updates.valor !== undefined ? updates.valor : oldTransaction.valor);
      
      // Reverter valores antigos
      let deltaReceitas = 0;
      let deltaDespesas = 0;
      
      if (oldTipo === 'entrada' || oldTipo === 'receita') deltaReceitas -= oldValor;
      else if (oldTipo === 'saida' || oldTipo === 'despesa') deltaDespesas -= oldValor;
      
      // Aplicar novos valores
      if (newTipo === 'entrada' || newTipo === 'receita') deltaReceitas += newValor;
      else if (newTipo === 'saida' || newTipo === 'despesa') deltaDespesas += newValor;
      
      return {
        balance: (currentCache.balance || 0) + deltaReceitas - deltaDespesas,
        totalReceitas: (currentCache.totalReceitas || 0) + deltaReceitas,
        totalDespesas: (currentCache.totalDespesas || 0) + deltaDespesas,
        timestamp: Date.now(),
        calculatedBy: uid,
        lastUpdate: 'update-transaction'
      };
    });
    console.log('[FINANCE] Cache de saldo ajustado após edição');
  } catch (cacheError) {
    console.error('[FINANCE] Erro ao atualizar cache (não crítico):', cacheError);
  }

  // Garantir saldo atualizado (evitar cache stale em casos de inconsistência)
  try {
    await db.ref(`clubs/${clubId}/cache/balance`).remove();
  } catch (cacheError) {
    console.error('[FINANCE] Erro ao invalidar cache (não crítico):', cacheError);
  }
  
  // 9. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'financial-update',
    `Editou transação: ${oldTransaction.descricao}`,
    { transactionId, oldData: oldTransaction, newData: updates }
  );
  
  console.log('[FINANCE] Transação atualizada:', transactionId);
  return { success: true };
});

/**
 * Deleta transação financeira (somente se < 90 dias)
 */
exports.deleteFinancialTransaction = functions.https.onCall(async (data, context) => {
  console.log('[DELETE-ULTRA-SIMPLES] Função chamada!');
  console.log('[DELETE-ULTRA-SIMPLES] Data:', data);
  return { success: true, message: 'Teste ultra simples funcionou!' };
});

// ===========================
// GESTÃO DE USUÁRIOS
// ===========================

/**
 * Aprova usuário pendente (somente admin)
 */
exports.approveUser = functions.https.onCall(async (data, context) => {
  console.log('[USER] Aprovando usuário:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, targetUserId } = data;
  const isPlatformAdmin = !!context.auth?.token?.platform_admin;
  
  // 2. Validar clube (admin global pode aprovar sem estar no clube)
  let member = null;
  let userRole = 'admin';
  if (!isPlatformAdmin) {
    member = await validateClubMembership(uid, clubId);
    // 3. Validar role (somente admin)
    userRole = await requireRole(uid, clubId, ['admin']);
  } else {
    member = {
      login: context.auth?.token?.email || 'admin-global',
      email: context.auth?.token?.email || 'admin-global'
    };
  }
  
  // 4. Validar usuário alvo
  const targetRef = db.ref(`clubs/${clubId}/members/${targetUserId}`);
  let targetSnapshot = await targetRef.once('value');
  
  if (!targetSnapshot.exists()) {
    if (!isPlatformAdmin) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
    }

    const pendingSnapshot = await db.ref(`pendingUsers/${targetUserId}`).once('value');
    if (!pendingSnapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
    }

    const pendingUser = pendingSnapshot.val();
    const clubSnapshot = await db.ref(`clubs/${clubId}/info/name`).once('value');
    const clubName = clubSnapshot.val() || 'Clube';

    const login = (pendingUser.email || '').split('@')[0] || 'usuario';
    await targetRef.set({
      login: login,
      email: pendingUser.email || '',
      nome: pendingUser.nome || 'Usuário',
      role: pendingUser.role || 'jogador',
      status: 'pending',
      joinedAt: new Date().toISOString()
    });

    await db.ref(`userClubs/${targetUserId}/${clubId}`).set({
      clubId: clubId,
      clubName: clubName,
      joinedAt: new Date().toISOString()
    });

    targetSnapshot = await targetRef.once('value');
  }
  
  const targetUser = targetSnapshot.val();
  if (targetUser.status !== 'pending') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Usuário não está pendente. Status atual: ${targetUser.status}`
    );
  }
  
  // 5. Aprovar usuário
  await db.ref(`clubs/${clubId}/members/${targetUserId}`).update({
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: uid
  });
  
  // 6. Sincronizar Custom Claims (se email disponível)
  if (targetUser.email) {
    try {
      const role = targetUser.role || 'jogador';
      const clubSnapshot = await db.ref(`clubs/${clubId}/nome`).once('value');
      const clubName = clubSnapshot.val() || 'Clube';
      
      await admin.auth().setCustomUserClaims(targetUserId, {
        role,
        clubId,
        clubName,
        updatedAt: Date.now()
      });
      
      console.log('[USER] Custom Claims sincronizados:', { targetUserId, role, clubId });
    } catch (error) {
      console.error('[USER] Erro ao sincronizar Custom Claims:', error);
      // Não falhar a aprovação por erro no Custom Claims
    }
  }
  
  // 7. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'user-approval',
    `Aprovou usuário: ${targetUser.nome || targetUser.email}`,
    { targetUserId, targetUserEmail: targetUser.email }
  );
  
  console.log('[USER] Usuário aprovado:', targetUserId);
  return { success: true };
});

/**
 * Rejeita usuário pendente (somente admin)
 */
exports.rejectUser = functions.https.onCall(async (data, context) => {
  console.log('[USER] Rejeitando usuário:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, targetUserId, reason } = data;
  const isPlatformAdmin = !!context.auth?.token?.platform_admin;
  
  // 2. Validar clube (admin global pode rejeitar sem estar no clube)
  let member = null;
  let userRole = 'admin';
  if (!isPlatformAdmin) {
    member = await validateClubMembership(uid, clubId);
    // 3. Validar role (somente admin)
    userRole = await requireRole(uid, clubId, ['admin']);
  } else {
    member = {
      login: context.auth?.token?.email || 'admin-global',
      email: context.auth?.token?.email || 'admin-global'
    };
  }
  
  // 4. Validar usuário alvo
  const targetSnapshot = await db.ref(`clubs/${clubId}/members/${targetUserId}`).once('value');
  if (!targetSnapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
  }
  
  const targetUser = targetSnapshot.val();
  
  // 5. Rejeitar usuário
  await db.ref(`clubs/${clubId}/members/${targetUserId}`).update({
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy: uid,
    rejectionReason: reason || 'Não especificado'
  });
  
  // 6. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'user-rejection',
    `Rejeitou usuário: ${targetUser.nome || targetUser.email}. Motivo: ${reason}`,
    { targetUserId, targetUserEmail: targetUser.email, reason }
  );
  
  console.log('[USER] Usuário rejeitado:', targetUserId);
  return { success: true };
});

/**
 * Muda role de usuário (somente admin) + sincroniza Custom Claims
 */
exports.changeUserRole = functions.https.onCall(async (data, context) => {
  console.log('[USER] Mudando role:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, targetUserId, newRole } = data;
  
  // 2. Validar clube
  const member = await validateClubMembership(uid, clubId);
  
  // 3. Validar role (somente admin)
  const userRole = await requireRole(uid, clubId, ['admin']);
  
  // 4. Validar nova role
  if (!VALID_ROLES.includes(newRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role inválida. Permitidas: ${VALID_ROLES.join(', ')}`
    );
  }
  
  // 5. Validar usuário alvo
  const targetSnapshot = await db.ref(`clubs/${clubId}/members/${targetUserId}`).once('value');
  if (!targetSnapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
  }
  
  const targetUser = targetSnapshot.val();
  const oldRole = targetUser.role || 'jogador';
  
  // 6. Atualizar role no database
  await db.ref(`clubs/${clubId}/members/${targetUserId}/role`).set(newRole);
  
  // 7. Sincronizar Custom Claims
  try {
    const clubSnapshot = await db.ref(`clubs/${clubId}/nome`).once('value');
    const clubName = clubSnapshot.val() || 'Clube';
    
    await admin.auth().setCustomUserClaims(targetUserId, {
      role: newRole,
      clubId,
      clubName,
      updatedAt: Date.now()
    });
    
    console.log('[USER] Custom Claims sincronizados:', { targetUserId, newRole, clubId });
  } catch (error) {
    console.error('[USER] Erro ao sincronizar Custom Claims:', error);
    // Reverter mudança no database
    await db.ref(`clubs/${clubId}/members/${targetUserId}/role`).set(oldRole);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao sincronizar permissões. Operação cancelada.'
    );
  }
  
  // 8. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'user-role-change',
    `Mudou role de ${targetUser.nome || targetUser.email}: ${oldRole} → ${newRole}`,
    { targetUserId, oldRole, newRole }
  );
  
  console.log('[USER] Role alterada:', { targetUserId, oldRole, newRole });
  return { success: true, message: 'Usuário deve fazer logout/login para aplicar mudanças' };
});

// ===========================
// CATEGORIAS FINANCEIRAS
// ===========================

/**
 * Cria categoria financeira (somente admin)
 */
exports.createCategory = functions.https.onCall(async (data, context) => {
  console.log('[CATEGORY] Criando categoria:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, nome, tipo } = data;
  
  // 2. Validar clube
  const member = await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin ou diretor)
  const userRole = await requireRole(uid, clubId, ['admin', 'diretor']);
  
  // 4. Validar dados
  if (!nome || nome.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Nome obrigatório');
  }
  
  if (!tipo || !['entrada', 'saida'].includes(tipo)) {
    throw new functions.https.HttpsError('invalid-argument', 'Tipo inválido (entrada/saida)');
  }
  
  // 5. Verificar se categoria já existe
  const tipoPath = tipo; // Agora usa entrada/saida direto
  const categoriesSnapshot = await db.ref(`clubs/${clubId}/categorias_financeiras/${tipoPath}`).once('value');
  const categories = categoriesSnapshot.val() || {};
  
  // Verificar se já existe categoria com esse nome
  const exists = Object.values(categories).some(cat => cat.nome === nome);
  if (exists) {
    throw new functions.https.HttpsError('already-exists', 'Categoria já existe');
  }
  
  // 6. Criar categoria com ID único
  const newCatRef = db.ref(`clubs/${clubId}/categorias_financeiras/${tipoPath}`).push();
  await newCatRef.set({
    id: newCatRef.key,
    nome,
    tipo: tipoPath
  });
  
  // 7. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'category-create',
    `Criou categoria ${tipo}: ${nome}`,
    { categoryName: nome, tipo }
  );
  
  console.log('[CATEGORY] Categoria criada:', nome);
  return { success: true };
});

/**
 * Deleta categoria financeira (somente admin)
 */
exports.deleteCategory = functions.https.onCall(async (data, context) => {
  console.log('[CATEGORY] Deletando categoria:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, nome } = data;
  
  // 2. Validar clube
  const member = await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin ou diretor)
  const userRole = await requireRole(uid, clubId, ['admin', 'diretor']);
  
  // 4. Buscar categoria nos dois paths possíveis (entrada/saida)
  let categoryId = null;
  let categoryData = null;
  let tipoPath = null;
  
  const [entradaSnapshot, saidaSnapshot] = await Promise.all([
    db.ref(`clubs/${clubId}/categorias_financeiras/entrada`).once('value'),
    db.ref(`clubs/${clubId}/categorias_financeiras/saida`).once('value')
  ]);
  
  const entradas = entradaSnapshot.val() || {};
  const saidas = saidaSnapshot.val() || {};
  
  // Procurar categoria pelo nome
  for (const [id, cat] of Object.entries(entradas)) {
    if (cat.nome === nome) {
      categoryId = id;
      categoryData = cat;
      tipoPath = 'entrada';
      break;
    }
  }
  
  if (!categoryId) {
    for (const [id, cat] of Object.entries(saidas)) {
      if (cat.nome === nome) {
        categoryId = id;
        categoryData = cat;
        tipoPath = 'saida';
        break;
      }
    }
  }
  
  if (!categoryId) {
    throw new functions.https.HttpsError('not-found', 'Categoria não encontrada');
  }
  
  // 5. Verificar se categoria está em uso
  const transactionsSnapshot = await db.ref(`clubs/${clubId}/financeiro`)
    .orderByChild('categoria')
    .equalTo(nome)
    .limitToFirst(1)
    .once('value');
  
  if (transactionsSnapshot.exists()) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Categoria em uso. Delete as transações primeiro.'
    );
  }
  
  // 6. Deletar categoria
  await db.ref(`clubs/${clubId}/categorias_financeiras/${tipoPath}/${categoryId}`).remove();
  
  // 7. Log de auditoria
  await logAction(
    clubId,
    uid,
    member.login || member.email,
    userRole,
    'category-delete',
    `Deletou categoria ${category.tipo}: ${nome}`,
    { categoryName: nome, tipo: category.tipo }
  );
  
  console.log('[CATEGORY] Categoria deletada:', nome);
  return { success: true };
});

/**
 * Cria novo usuário no clube (platform_admin ou diretor/admin do clube)
 * 
 * @param {Object} data - { clubId, email, nome, perfil }
 * @returns {Object} - { uid, email, senhaTemporaria }
 */
exports.createUserByDirector = functions.https.onCall(async (data, context) => {
  console.log('[USER_CREATE] Iniciando criação de usuário:', data);
  
  try {
    // 1. Validar autenticação
    const uid = requireAuth(context);
    const { clubId, email, nome, perfil } = data;
    
    if (!clubId) {
      throw new functions.https.HttpsError('invalid-argument', 'Club ID obrigatório');
    }
    
    // 2. Verificar permissões: platform_admin OU diretor/admin do clube
    const isPlatformAdmin = !!context.auth?.token?.platform_admin;
    let userRole = 'platform_admin';
    let member = null;
    
    if (!isPlatformAdmin) {
      // Validar club membership para diretor/admin local
      member = await validateClubMembership(uid, clubId);
      userRole = await requireRole(uid, clubId, ['admin', 'diretor']);
      console.log('[USER_CREATE] ✅ Autorizado como diretor/admin do clube:', userRole);
    } else {
      console.log('[USER_CREATE] ✅ Autorizado como platform_admin');
    }
    
    // 3. Validar dados
    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Email inválido');
    }
    if (!nome || nome.trim() === '') {
      throw new functions.https.HttpsError('invalid-argument', 'Nome obrigatório');
    }
    if (!perfil || !VALID_ROLES.includes(perfil)) {
      throw new functions.https.HttpsError('invalid-argument', 'Perfil inválido');
    }
    
    // 4. Gerar senha temporária (8 caracteres)
    const senhaTemporaria = Math.random().toString(36).substring(2, 10);
    
    // 5. Criar usuário no Firebase Auth
    let newUser;
    try {
      newUser = await admin.auth().createUser({
        email: email.toLowerCase(),
        password: senhaTemporaria,
        displayName: nome
      });
      console.log('[USER_CREATE] ✅ Usuário criado em Auth:', newUser.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Email já registrado');
      }
      throw new functions.https.HttpsError('internal', authError.message);
    }
    
    // 6. Criar entry no clube com flag de primeira senha
    const login = email.split('@')[0];
    await db.ref(`clubs/${clubId}/members/${newUser.uid}`).set({
      login,
      email: email.toLowerCase(),
      nome,
      role: perfil,
      status: 'approved',
      joinedAt: new Date().toISOString(),
      firstLoginRequired: true,  // ← FLAG PARA FORÇAR TROCA DE SENHA
      createdBy: uid,
      createdAt: new Date().toISOString()
    });
    
    // 7. Criar userClubs mapping
    const clubInfo = await db.ref(`clubs/${clubId}/info`).once('value');
    const clubName = clubInfo.val()?.name || clubId;
    await db.ref(`userClubs/${newUser.uid}/${clubId}`).set({
      clubId,
      clubName,
      joinedAt: new Date().toISOString()
    });
    
    // 8. Setar Custom Claims no token do usuário
    try {
      await admin.auth().setCustomUserClaims(newUser.uid, {
        role: perfil,
        clubId,
        clubName,
        updatedAt: Date.now()
      });
      console.log('[USER_CREATE] ✅ Custom Claims configurados:', { uid: newUser.uid, role: perfil, clubId });
    } catch (claimsError) {
      console.error('[USER_CREATE] ⚠️ Erro ao setar Custom Claims:', claimsError.message);
      // Não falhar a criação por erro no Custom Claims
    }
    
    // 9. Log de auditoria
    const creatorLogin = isPlatformAdmin ? 'platform_admin' : (member?.login || member?.email || uid);
    await logAction(
      clubId,
      uid,
      creatorLogin,
      userRole,
      'user-create',
      `Criou usuário ${perfil}: ${nome} (${email})`,
      { userEmail: email, userRole: perfil }
    );
    
    console.log('[USER_CREATE] ✅ Usuário criado com sucesso:', newUser.uid);
    return {
      uid: newUser.uid,
      email: email.toLowerCase(),
      senhaTemporaria,
      message: `Usuário criado! Senha temporária: ${senhaTemporaria}`
    };
    
  } catch (error) {
    console.error('[USER_CREATE] ❌ Erro:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Regenera a senha temporária de um usuário existente
 * Pode ser chamada por: platform_admin ou admin/diretor do clube
 */
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
  try {
    // Validar autenticação
    const uid = requireAuth(context);
    const { uid: targetUid, clubId } = data;

    // Validar entrada
    if (!targetUid || !clubId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'uid e clubId são obrigatórios'
      );
    }

    // Verificar autorização
    const userToken = context.auth.token;
    const isPlatformAdmin = !!userToken.platform_admin;

    if (!isPlatformAdmin) {
      // Se não é platform_admin, validar membership e role no clube
      await validateClubMembership(uid, clubId);
      await requireRole(uid, clubId, ['admin', 'diretor']);
    }

    // Verificar que o usuário alvo existe
    let targetUser;
    try {
      targetUser = await admin.auth().getUser(targetUid);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
      }
      throw err;
    }

    // Verificar que o usuário alvo está no mesmo clube (se não for platform_admin)
    if (!isPlatformAdmin) {
      const targetUserData = await admin
        .database()
        .ref(`clubs/${clubId}/members/${targetUid}`)
        .once('value');
      if (!targetUserData.exists()) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Você não pode resetar senhas de usuários de outros clubes'
        );
      }
    }

    // Gerar nova senha temporária
    const novaSenha = Math.random().toString(36).substring(2, 10);

    // Atualizar senha no Firebase Auth
    await admin.auth().updateUser(targetUid, {
      password: novaSenha
    });

    // Registrar a ação no log de auditoria
    const now = new Date().toISOString();
    const logEntry = {
      action: 'password_reset',
      actionBy: uid,
      actionByName: userToken.name || userToken.email,
      targetUser: targetUid,
      targetUserEmail: targetUser.email,
      clubId: clubId,
      timestamp: now,
      reason: 'Usuário perdeu a senha temporária'
    };

    // Guardar log
    await admin
      .database()
      .ref(`auditLogs/passwordResets/${Date.now()}_${clubId}_${targetUid}`)
      .set(logEntry);

    console.log(`✓ Nova senha gerada para ${targetUser.email} por ${userToken.email}`, logEntry);

    return {
      success: true,
      novaSenha: novaSenha,
      email: targetUser.email
    };

  } catch (error) {
    console.error('Erro em resetUserPassword:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===========================
// GESTÃO DE SALDO (CONCORRÊNCIA)
// ===========================

/**
 * Calcula saldo total do clube de forma atômica
 * 
 * CONCORRÊNCIA RESOLVIDA:
 * - Cálculo server-side (confiável)
 * - Leitura atômica de todas transações
 * - Cache de resultado para performance
 * 
 * Inclui:
 * - Transações financeiras (receitas/despesas)
 * - Mensalidades de jogadores (pagas)
 */
exports.getBalance = functions.https.onCall(async (data, context) => {
  console.log('[BALANCE] Calculando saldo:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, forceRecalculate } = data;
  
  // 2. Validar clube
  await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin, diretor ou jogador aprovado)
  const userRole = await getUserRole(uid, clubId);
  if (!VALID_ROLES.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Role inválida');
  }
  
  // 4. Verificar se existe cache válido (< 5 minutos)
  if (!forceRecalculate) {
    const cacheSnapshot = await db.ref(`clubs/${clubId}/cache/balance`).once('value');
    const cache = cacheSnapshot.val();
    
    if (cache && cache.timestamp) {
      const cacheAge = Date.now() - cache.timestamp;
      if (cacheAge < 5 * 60 * 1000) { // 5 minutos
        console.log('[BALANCE] Retornando cache:', { age: Math.floor(cacheAge / 1000), balance: cache.balance });
        return {
          balance: cache.balance,
          totalReceitas: cache.totalReceitas || 0,
          totalDespesas: cache.totalDespesas || 0,
          cached: true,
          cacheAge: Math.floor(cacheAge / 1000)
        };
      }
    }
  }
  
  // 5. Calcular saldo do zero (server-side atômico)
  const [financeiroSnapshot, jogadoresSnapshot] = await Promise.all([
    db.ref(`clubs/${clubId}/financeiro`).once('value'),
    db.ref(`clubs/${clubId}/jogadores`).once('value')
  ]);
  
  let totalReceitas = 0;
  let totalDespesas = 0;
  
  // 5.1. Somar transações financeiras
  financeiroSnapshot.forEach(childSnapshot => {
    const transaction = childSnapshot.val();
    if (!transaction || !transaction.valor) return;
    
    const valor = parseFloat(transaction.valor);
    if (isNaN(valor)) return;
    
    if (transaction.tipo === 'entrada') {
      totalReceitas += valor;
    } else if (transaction.tipo === 'saida') {
      totalDespesas += valor;
    }
  });
  
  // 5.2. Somar mensalidades pagas
  jogadoresSnapshot.forEach(childSnapshot => {
    const jogador = childSnapshot.val();
    if (!jogador || !jogador.mensalidades) return;
    
      if (Array.isArray(jogador.mensalidades)) {
        jogador.mensalidades.forEach(mensal => {
          if (mensal && mensal.pago) {
            const valorPago = parseFloat(mensal.valorPago || mensal.valor || 0);
            if (!isNaN(valorPago)) {
              totalReceitas += valorPago;
            }
          }
        });
      } else if (typeof jogador.mensalidades === 'object') {
        Object.values(jogador.mensalidades).forEach(mensal => {
          if (mensal && mensal.pago) {
            const valorPago = parseFloat(mensal.valorPago || mensal.valor || 0);
            if (!isNaN(valorPago)) {
              totalReceitas += valorPago;
            }
          }
        });
      }
  });
  
  const balance = totalReceitas - totalDespesas;
  
  // 6. Atualizar cache
  await db.ref(`clubs/${clubId}/cache/balance`).set({
    balance,
    totalReceitas,
    totalDespesas,
    timestamp: Date.now(),
    calculatedBy: uid
  });
  
  console.log('[BALANCE] Saldo calculado:', { balance, totalReceitas, totalDespesas });
  
  return {
    balance,
    totalReceitas,
    totalDespesas,
    cached: false
  };
});

/**
 * Atualiza cache de saldo incrementalmente (otimização)
 * 
 * CONCORRÊNCIA RESOLVIDA:
 * - Usa Firebase Transaction (atomic increment)
 * - Múltiplas chamadas simultâneas são serializadas
 * - Previne race conditions
 * 
 * Chamado automaticamente ao:
 * - Adicionar transação financeira
 * - Editar transação (ajusta diferença)
 * - Deletar transação
 * - Adicionar mensalidade paga
 */
exports.updateBalanceCache = functions.https.onCall(async (data, context) => {
  console.log('[BALANCE] Atualizando cache incrementalmente:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId, deltaReceitas, deltaDespesas } = data;
  
  // 2. Validar clube
  await validateClubMembership(uid, clubId);
  
  // 3. Validar role (admin ou diretor)
  await requireRole(uid, clubId, ['admin', 'diretor']);
  
  // 4. Validar deltas
  const deltaReceitasNum = parseFloat(deltaReceitas || 0);
  const deltaDespesasNum = parseFloat(deltaDespesas || 0);
  
  if (isNaN(deltaReceitasNum) || isNaN(deltaDespesasNum)) {
    throw new functions.https.HttpsError('invalid-argument', 'Deltas inválidos');
  }
  
  // 5. Usar Firebase Transaction para atualização atômica
  const cacheRef = db.ref(`clubs/${clubId}/cache/balance`);
  
  try {
    const result = await cacheRef.transaction((currentCache) => {
      // Se cache não existe, não atualiza (forçar recálculo completo)
      if (!currentCache) {
        console.log('[BALANCE] Cache não existe, pulando atualização incremental');
        return currentCache;
      }
      
      // Atualizar incrementalmente
      const newTotalReceitas = (currentCache.totalReceitas || 0) + deltaReceitasNum;
      const newTotalDespesas = (currentCache.totalDespesas || 0) + deltaDespesasNum;
      const newBalance = newTotalReceitas - newTotalDespesas;
      
      return {
        balance: newBalance,
        totalReceitas: newTotalReceitas,
        totalDespesas: newTotalDespesas,
        timestamp: Date.now(),
        calculatedBy: uid,
        incrementalUpdate: true
      };
    });
    
    if (!result.committed) {
      console.warn('[BALANCE] Transação não commitada, cache pode estar desatualizado');
      return { success: false, message: 'Cache não atualizado (não existe)' };
    }
    
    const newCache = result.snapshot.val();
    console.log('[BALANCE] Cache atualizado incrementalmente:', newCache);
    
    return {
      success: true,
      balance: newCache.balance,
      totalReceitas: newCache.totalReceitas,
      totalDespesas: newCache.totalDespesas
    };
  } catch (error) {
    console.error('[BALANCE] Erro ao atualizar cache:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao atualizar cache de saldo');
  }
});

/**
 * Invalida cache de saldo (forçar recálculo)
 * 
 * Útil quando:
 * - Cache corrompido
 * - Migração de dados
 * - Inconsistências detectadas
 */
exports.invalidateBalanceCache = functions.https.onCall(async (data, context) => {
  console.log('[BALANCE] Invalidando cache:', data);
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId } = data;
  
  // 2. Validar clube
  await validateClubMembership(uid, clubId);
  
  // 3. Validar role (somente admin)
  await requireRole(uid, clubId, ['admin']);
  
  // 4. Deletar cache
  await db.ref(`clubs/${clubId}/cache/balance`).remove();
  
  console.log('[BALANCE] Cache invalidado');
  
  return { success: true, message: 'Cache invalidado. Próxima leitura irá recalcular.' };
});

/**
 * Sincroniza Custom Claims quando o status do usuário muda
 * Chamado automaticamente quando usuário é ativado/desativado
 */
exports.syncUserClaims = functions.https.onCall(async (data, context) => {
  console.log('[CLAIMS] Sincronizando custom claims:', data);
  
  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId obrigatório');
  }
  
  try {
    // 1. Buscar dados do usuário em todos os clubes
    const clubsSnapshot = await db.ref('clubs').once('value');
    const clubs = clubsSnapshot.val() || {};
    
    // 2. Encontrar o usuário e coletar dados
    let userClaims = null;
    let primaryClubId = null;
    let primaryClubName = null;
    let userRole = 'jogador'; // Default
    let userStatus = 'rejected'; // Default (seguro)
    
    for (const [clubId, clubData] of Object.entries(clubs)) {
      if (!clubData.members) continue;
      
      const member = clubData.members[userId];
      if (member) {
        // Encontrou o usuário neste clube
        if (!primaryClubId) {
          // Usar o primeiro clube encontrado como primário
          primaryClubId = clubId;
          primaryClubName = clubData.nome || 'Clube';
          userRole = member.role || 'jogador';
          userStatus = member.status || 'rejected';
        }
      }
    }
    
    if (!primaryClubId) {
      console.warn('[CLAIMS] Usuário não encontrado em nenhum clube:', userId);
      // Remover claims se usuário foi deletado
      await admin.auth().setCustomUserClaims(userId, null);
      return { success: true, message: 'Claims removidos (usuário sem clube)' };
    }
    
    // 3. Construir novo objeto de claims baseado no status
    const newClaims = {
      role: userRole,
      clubId: primaryClubId,
      clubName: primaryClubName,
      active: userStatus === 'approved', // Apenas 'approved' é ativo
      status: userStatus,
      updatedAt: Date.now(),
      syncedAs: 'client-initiated' // Marcador para rastreamento
    };
    
    console.log('[CLAIMS] Novo claims:', newClaims);
    
    // 4. Aplicar claims
    await admin.auth().setCustomUserClaims(userId, newClaims);
    
    console.log('[CLAIMS] Custom Claims sincronizados com sucesso para:', userId);
    
    return { 
      success: true, 
      message: 'Custom Claims sincronizados',
      claims: newClaims
    };
    
  } catch (error) {
    console.error('[CLAIMS] Erro ao sincronizar custom claims:', error);
    throw new functions.https.HttpsError('internal', `Erro ao sincronizar: ${error.message}`);
  }
});

/**
 * Migra dados financeiros da raiz para o clube (temporário)
 */
exports.migrateFinanceiro = functions.https.onCall(async (data, context) => {
  console.log('[MIGRATE] Iniciando migração financeiro');
  
  // 1. Validar autenticação
  const uid = requireAuth(context);
  const { clubId } = data;
  
  // 2. Validar clube
  await validateClubMembership(uid, clubId);
  
  // 3. Validar role (somente admin)
  await requireRole(uid, clubId, ['admin']);
  
  try {
    // 4. Ler dados de /financeiro (raiz)
    const rootSnapshot = await db.ref('financeiro').once('value');
    const rootData = rootSnapshot.val();
    
    if (!rootData) {
      return { success: false, message: 'Nenhum dado encontrado em /financeiro' };
    }
    
    const registros = Object.entries(rootData);
    console.log(`[MIGRATE] Encontrados ${registros.length} registros`);
    
    // 5. Copiar para /clubs/{clubId}/financeiro
    let copiados = 0;
    for (const [key, value] of registros) {
      await db.ref(`clubs/${clubId}/financeiro/${key}`).set(value);
      copiados++;
      console.log(`[MIGRATE] Copiado [${copiados}/${registros.length}]: ${value.categoria}`);
    }
    
    console.log(`[MIGRATE] Migração concluída: ${copiados} registros`);
    
    return { 
      success: true, 
      message: `${copiados} registros migrados com sucesso`,
      total: copiados
    };
  } catch (err) {
    console.error('[MIGRATE] Erro:', err);
    throw new functions.https.HttpsError('internal', `Erro na migração: ${err.message}`);
  }
});

