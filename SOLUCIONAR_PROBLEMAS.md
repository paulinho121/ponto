# Guia de Solução de Problemas - Ponto Qfam

Este guia ajuda a resolver os problemas mais comuns com o sistema de ponto.

## Problemas Comuns e Soluções

### 1. Aplicação não reconhece o banco de dados

#### Diagnóstico Rápido:
1. Abra o console do navegador (F12)
2. Execute: `runQuickDiagnosis()`
3. Verifique os resultados

#### Soluções:
- **Verifique as credenciais do Supabase** no arquivo `supabase-config.js`
- **Certifique-se de que o projeto Supabase esteja ativo**
- **Verifique se as políticas RLS estão configuradas corretamente**

### 2. Problemas de login

#### Diagnóstico:
1. Execute: `window.chronosSupabase.auth.getSession()` no console
2. Verifique se há alguma mensagem de erro

#### Soluções:
- **Confirme que o email e senha estão corretos**
- **Verifique se a conta não está suspensa**
- **Certifique-se de que o usuário tem permissão para acessar o sistema**

### 3. Problemas com registros de ponto

#### Diagnóstico:
1. Execute: `resolvePointsIssues()` no console
2. Verifique se os serviços estão disponíveis

#### Soluções:
- **Verifique permissões de geolocalização**
- **Confirme que o usuário está em um local autorizado**
- **Verifique se as tabelas do banco de dados estão configuradas corretamente**

## Scripts de Diagnóstico Disponíveis

Após carregar a página, os seguintes comandos estarão disponíveis no console:

- `runQuickDiagnosis()` - Diagnóstico rápido do sistema
- `resolvePointsIssues()` - Tenta resolver problemas comuns
- `window.SystemInitializer.showStatus()` - Mostra status do sistema

## Verificação Manual

Se os scripts automáticos não funcionarem, você pode verificar manualmente:

```javascript
// Verificar se o cliente Supabase está disponível
console.log('Cliente Supabase:', !!window.chronosSupabase);

// Verificar autenticação
if (window.chronosSupabase) {
  window.chronosSupabase.auth.getSession().then(({ data, error }) => {
    console.log('Sessão:', data.session ? 'Ativa' : 'Inativa');
    if (error) console.error('Erro de sessão:', error);
  });
}

// Verificar conexão com banco
if (window.chronosSupabase) {
  window.chronosSupabase.from('profiles').select('id').limit(1).then(result => {
    console.log('Conexão com banco:', result.error ? 'Falhou' : 'OK');
  });
}
```

## Procedimento Completo de Resolução

1. **Feche todas as abas** do sistema Ponto Qfam
2. **Limpe o cache** do navegador (Ctrl+Shift+Del)
3. **Reabra a página** e espere o carregamento completo
4. **Abra o console do navegador** (F12)
5. **Execute:** `resolvePointsIssues()`
6. **Tente fazer login novamente**

## Verificação de Configuração do Supabase

Certifique-se de que seu `supabase-config.js` contém:

```javascript
window.CHRONOS_SUPABASE = {
  url: 'https://SEU_PROJETO.supabase.co',
  anonKey: 'SUA_CHAVE_ANONIMA_AQUI'
};
```

Substitua `SEU_PROJETO` e `SUA_CHAVE_ANONIMA_AQUI` pelas suas credenciais reais do Supabase.

## Contato para Suporte

Se os problemas persistirem:

- Entre em contato com o suporte técnico
- Forneça os logs do console do navegador
- Descreva as etapas que levaram ao problema