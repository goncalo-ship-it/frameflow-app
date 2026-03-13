// Cloud Functions — Flame Board
// Funções server-side para operações que não devem correr no cliente

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// ── Roles e níveis de acesso (espelho do cliente) ──────────────────
const ADMIN_ROLES = ["director_producao", "produtor_executivo"];
const CHEFIA_ROLES = [...ADMIN_ROLES, "chefe_producao", "primeiro_ad", "realizador"];

// ── createTeamMember ───────────────────────────────────────────────
// Admin cria um user via Admin SDK (não afecta sessão actual)
// NUNCA usar createUserWithEmailAndPassword no cliente para criar outros users
exports.createTeamMember = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário");

  const { email, password, name, role, department, projectId } = request.data;
  if (!email || !password || !name || !role || !projectId) {
    throw new HttpsError("invalid-argument", "Campos obrigatórios: email, password, name, role, projectId");
  }

  // Verificar que quem chama é admin do projecto
  const db = getFirestore();
  const callerDoc = await db.doc(`projects/${projectId}/users/${request.auth.uid}`).get();
  if (!callerDoc.exists || !ADMIN_ROLES.includes(callerDoc.data().role)) {
    throw new HttpsError("permission-denied", "Apenas admins podem criar utilizadores");
  }

  // Verificar que não está a criar um admin se não é admin
  if (ADMIN_ROLES.includes(role) && !ADMIN_ROLES.includes(callerDoc.data().role)) {
    throw new HttpsError("permission-denied", "Não podes criar um utilizador com role superior ao teu");
  }

  // Criar no Firebase Auth via Admin SDK
  const auth = getAuth();
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Este email já está registado");
    }
    throw new HttpsError("internal", err.message);
  }

  // Custom Claims com role e projectId
  await auth.setCustomUserClaims(userRecord.uid, {
    role,
    projectId,
  });

  // Guardar perfil no Firestore
  await db.doc(`projects/${projectId}/users/${userRecord.uid}`).set({
    name,
    role,
    department: department || null,
    email,
    firebaseUid: userRecord.uid,
    createdBy: request.auth.uid,
    createdAt: new Date(),
  });

  return { uid: userRecord.uid, email, name, role };
});

// ── getPersonalizedCallsheet ──────────────────────────────────────
// Devolve a call sheet filtrada por role do user
exports.getPersonalizedCallsheet = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário");

  const { projectId, date } = request.data;
  if (!projectId || !date) {
    throw new HttpsError("invalid-argument", "projectId e date são obrigatórios");
  }

  const db = getFirestore();

  // Buscar perfil do user
  const userDoc = await db.doc(`projects/${projectId}/users/${request.auth.uid}`).get();
  if (!userDoc.exists) throw new HttpsError("not-found", "User não pertence a este projecto");

  const userData = userDoc.data();
  const userRole = userData.role;

  // Buscar call sheet
  const csDoc = await db.doc(`projects/${projectId}/callsheets/${date}`).get();
  if (!csDoc.exists) throw new HttpsError("not-found", "Call sheet não encontrada");

  const callsheet = csDoc.data();

  // Admin e chefia: tudo
  if (CHEFIA_ROLES.includes(userRole)) {
    return callsheet;
  }

  // Elenco: só a sua secção
  const castRoles = ["elenco_principal", "elenco_sec_adulto", "elenco_sec_juvenil", "figuracao"];
  if (castRoles.includes(userRole)) {
    const characterName = userData.characterName || userData.name;
    return {
      date: callsheet.date,
      generalCall: callsheet.generalCall,
      location: callsheet.location,
      myCall: (callsheet.cast || []).find(c => c.character === characterName),
      myScenes: (callsheet.scenes || []).filter(s =>
        (s.characters || []).includes(characterName)
      ),
      meals: callsheet.meals,
    };
  }

  // Catering: só headcount e refeições
  if (userRole === "catering") {
    return {
      date: callsheet.date,
      headcount: (callsheet.totalCrew || 0) + (callsheet.totalCast || 0),
      meals: callsheet.meals,
    };
  }

  // Técnico: tudo menos orçamento
  const { budget, ...publicCallsheet } = callsheet;
  return publicCallsheet;
});

// ── deleteTeamMember ──────────────────────────────────────────────
// Admin remove um user do projecto e opcionalmente do Auth
exports.deleteTeamMember = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login necessário");

  const { projectId, userId, deleteAuth } = request.data;
  if (!projectId || !userId) {
    throw new HttpsError("invalid-argument", "projectId e userId são obrigatórios");
  }

  const db = getFirestore();

  // Verificar permissão
  const callerDoc = await db.doc(`projects/${projectId}/users/${request.auth.uid}`).get();
  if (!callerDoc.exists || !ADMIN_ROLES.includes(callerDoc.data().role)) {
    throw new HttpsError("permission-denied", "Apenas admins podem remover utilizadores");
  }

  // Não pode remover-se a si próprio
  if (userId === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Não podes remover-te a ti próprio");
  }

  // Remover do Firestore
  await db.doc(`projects/${projectId}/users/${userId}`).delete();

  // Opcionalmente remover do Auth
  if (deleteAuth) {
    try {
      await getAuth().deleteUser(userId);
    } catch { /* user pode não existir no Auth */ }
  }

  return { success: true };
});
