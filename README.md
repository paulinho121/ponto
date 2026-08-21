### 2. Validação de Localização (Geofencing)
- Verifica se o ponto está sendo batido em locais autorizados
- Exige precisão mínima da localização GPS
- Utiliza sistema de geofencing para garantir que o ponto só seja batido em locais específicos
- Implementa mecanismos de segurança para prevenir fraudes e uso de localização falsa

### 3. Cadastro apenas por convite
- O acesso ao app é fechado: **novas contas só são criadas por convite** gerado por um super administrador.
- No painel de administração (aba **Convites**), o super admin gera um link de **uso único** (`cadastro.html?convite=TOKEN`), opcionalmente pré-preenchendo nome/e-mail e definindo a validade.
- O gate é aplicado no **servidor**: a função `handle_new_user()` exige um convite válido e o consome no cadastro — sem token válido, a conta não é criada (não dá para burlar pelo front).
- Todo convite cria um **pesquisador comum**; promover a super administrador continua sendo manual (`is_admin` no banco).
- **Migração**: rode `supabase/008_convites.sql` no SQL Editor do Supabase (idempotente e não-destrutivo).

### 4. Correções de Segurança Implementadas
- **Correção de RLS (Row Level Security)**: Implementação de função `is_admin()` com `security definer` para resolver problemas de recursão e bloqueios
- **Proteção contra alteração de privilégios**: Impede que usuários alterem seu próprio status de administração
- **Valiação de dados de entrada**: Implementação de validadores robustos para prevenir injeção de dados maliciosos
- **Controle de acesso refinado**: Políticas de RLS atualizadas para permitir que admins gerenciem usuários e registros de forma segura
- **Segurança em tempo de execução**: Mecanismos de verificação de segurança antes de cada registro de ponto