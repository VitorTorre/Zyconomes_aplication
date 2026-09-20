/**
 * ==============================================================================
 * ZYCONOMES - SENIOR CHAOS & IDEMPOTENCY TESTER (2018-style RAW JS)
 * ==============================================================================
 * 
 * Caro Sênior de 2018:
 * Nós sabemos que você confia mais no código do que em slides. 
 * O objetivo deste script é provar, sem usar k6 ou ferramentas externas pesadas,
 * que a API que construímos aguenta "The Chaos".
 * 
 * O que isso prova:
 * 1. Zod no Backend: Enviar lixo via cURL/Fetch será rejeitado pelo Zod na borda.
 * 2. Idempotência de Milissegundo: 50 requests no exato mesmo TICK. Apenas 1 passa.
 * 3. Máquina de Estados: OTP não ativa contas ativas e exige fluxo exato.
 * 
 * Uso: npx ts-node src/scripts/chaos-test.ts
 */

const API_URL = 'http://127.0.0.1:3000/api/v1';

async function log(step: string, message: string, color: string = '\x1b[0m') {
  console.log(`\n${color}[${step}] => ${message}\x1b[0m`);
}

async function runChaos() {
  log('BOOT', 'Iniciando testes de sanidade avançados...', '\x1b[36m');

  // ============================================================================
  // TESTE 1: ZOD BYPASS ATTEMPT
  // ============================================================================
  log('TESTE 1', 'Tentando enviar CPF inválido e Senha Fraca (Bypass do React)');
  const res1 = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'hacker@malicioso.com',
      nome_completo: 'Mr. Robot',
      cpf: '123', // INVÁLIDO
      senha_plana: '123' // INVÁLIDO
    })
  });
  
  if (res1.status === 400) {
    const data = await res1.json();
    log('SUCESSO (TESTE 1)', `Zod bloqueou com sucesso: ${JSON.stringify(data.issues)}`, '\x1b[32m');
  } else {
    log('FALHA (TESTE 1)', `API aceitou lixo! Status: ${res1.status}`, '\x1b[31m');
  }

  // ============================================================================
  // TESTE 2: RACE CONDITION IDEMPOTÊNCIA (THE "TICK" EXPLOT)
  // ============================================================================
  const raceEmail = `race.condition.${Date.now()}@zyconomes.com.br`;
  log('TESTE 2', `Disparando 50 POSTs concorrentes no mesmo milissegundo para ${raceEmail}...`);
  
  const payload = {
    email: raceEmail,
    nome_completo: 'Teste Concorrencia Real',
    cpf: '111.222.333-44',
    senha_plana: 'ValidPass#2026'
  };

  const requests = Array.from({ length: 50 }).map(() => 
    fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );

  const responses = await Promise.all(requests);
  const statusCodes = responses.map(r => r.status);
  
  const createdCount = statusCodes.filter(s => s === 201).length;
  const conflictCount = statusCodes.filter(s => s === 409).length;

  if (createdCount === 1 && conflictCount === 49) {
    log('SUCESSO (TESTE 2)', `A defesa do Redis SETNX funcionou perfeitamente. 1 Criação, 49 Conflitos simultâneos.`, '\x1b[32m');
  } else {
    log('FALHA CRÍTICA (TESTE 2)', `Idempotência violada! 201: ${createdCount}, 409: ${conflictCount}`, '\x1b[31m');
  }

  // ============================================================================
  // TESTE 3: MÁQUINA DE ESTADOS E OTP
  // ============================================================================
  log('TESTE 3', `Verificando OTP e mudança de estado para ${raceEmail}`);
  
  // Tentativa de OTP Falso
  const resOtpFake = await fetch(`${API_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: raceEmail, otp_code: '999999' })
  });
  
  if (resOtpFake.status === 401) {
    log('SUCESSO (TESTE 3A)', `OTP Falso rejeitado corretamente (401).`, '\x1b[32m');
  }

  // OTP Verdadeiro
  const resOtpTrue = await fetch(`${API_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: raceEmail, otp_code: '123456' })
  });

  if (resOtpTrue.status === 200) {
    log('SUCESSO (TESTE 3B)', `OTP Validado e conta ativada com sucesso (200).`, '\x1b[32m');
  }

  // Tentativa de Duplo OTP (Estado já ativo)
  const resOtpDouble = await fetch(`${API_URL}/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: raceEmail, otp_code: '123456' })
  });

  if (resOtpDouble.status === 400) {
    log('SUCESSO (TESTE 3C)', `Dupla ativação rejeitada. Máquina de estados bloqueou conta já ATIVA.`, '\x1b[32m');
  } else {
    log('FALHA (TESTE 3C)', `Máquina de estados falhou.`, '\x1b[31m');
  }

  log('END', 'Testes Chaos finalizados.', '\x1b[36m');
}

runChaos().catch(console.error);
