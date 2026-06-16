import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const allowedRoles = new Set(['owner', 'manager', 'salesperson']);

type CreateAdminUserPayload = {
  email?: string;
  company_id?: string;
  role?: string;
  active?: boolean;
  password?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function makeTemporaryPassword() {
  const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `Marmoraria3D@2026${randomSuffix}`;
}

function validateTemporaryPassword(password: string) {
  if (password.length < 8) {
    return 'A senha temporária deve ter pelo menos 8 caracteres.';
  }

  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    return 'A senha temporária deve conter pelo menos uma letra e um número.';
  }

  return null;
}

function nameFromEmail(email: string) {
  return email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || email;
}

function readableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    const knownMessage =
      errorRecord.message ??
      errorRecord.error_description ??
      errorRecord.details ??
      errorRecord.hint ??
      errorRecord.code;

    if (typeof knownMessage === 'string' && knownMessage.trim()) {
      return knownMessage;
    }

    return JSON.stringify(errorRecord);
  }

  return String(error);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: 'Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.' },
        500,
      );
    }

    const authorization = request.headers.get('Authorization') ?? '';
    const token = authorization.replace('Bearer ', '').trim();

    if (!token) {
      return jsonResponse({ error: 'Usuário não autenticado.' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.getUser(token);

    if (authUserError || !authUserData.user?.email) {
      return jsonResponse({ error: 'Sessão inválida.' }, 401);
    }

    const callerEmail = authUserData.user.email.toLowerCase();

    const { data: callerProfile, error: callerProfileError } =
      await supabaseAdmin
        .from('users')
        .select('id,email,role,active')
        .ilike('email', callerEmail)
        .eq('role', 'superadmin')
        .eq('active', true)
        .maybeSingle();

    if (callerProfileError) {
      throw callerProfileError;
    }

    if (!callerProfile) {
      return jsonResponse({ error: 'Acesso não autorizado.' }, 403);
    }

    const payload = (await request.json()) as CreateAdminUserPayload;
    const email = payload.email?.trim().toLowerCase() ?? '';
    const companyId = payload.company_id?.trim() ?? '';
    const role = payload.role?.trim() ?? '';
    const active = payload.active ?? true;
    const manualPassword = payload.password?.trim() ?? '';

    if (!email) {
      return jsonResponse({ error: 'E-mail é obrigatório.' }, 400);
    }

    if (!companyId) {
      return jsonResponse({ error: 'Empresa é obrigatória.' }, 400);
    }

    if (!allowedRoles.has(role)) {
      return jsonResponse({ error: 'Role inválida.' }, 400);
    }

    if (manualPassword) {
      const passwordError = validateTemporaryPassword(manualPassword);

      if (passwordError) {
        return jsonResponse({ error: passwordError }, 400);
      }
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) {
      throw companyError;
    }

    if (!company) {
      return jsonResponse({ error: 'Empresa não encontrada.' }, 404);
    }

    const temporaryPassword = manualPassword || makeTemporaryPassword();

    const { data: authUsers, error: listUsersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      throw listUsersError;
    }

    const existingAuthUser = authUsers.users.find(
      (authUser) => authUser.email?.toLowerCase() === email,
    );

    if (existingAuthUser) {
      const { error: updateAuthError } =
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          email_confirm: true,
          password: temporaryPassword,
        });

      if (updateAuthError) {
        throw updateAuthError;
      }
    } else {
      const { error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: temporaryPassword,
          email_confirm: true,
        });

      if (createAuthError) {
        throw createAuthError;
      }
    }

    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email);

    if (profilesError) {
      throw profilesError;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const profileIds = existingProfiles.map((profile) => profile.id);
      const { error: updateProfileError } = await supabaseAdmin
        .from('users')
        .update({
          company_id: companyId,
          role,
          active,
          name: nameFromEmail(email),
        })
        .in('id', profileIds);

      if (updateProfileError) {
        throw updateProfileError;
      }
    } else {
      const { error: insertProfileError } = await supabaseAdmin
        .from('users')
        .insert({
          company_id: companyId,
          name: nameFromEmail(email),
          email,
          role,
          active,
        });

      if (insertProfileError) {
        throw insertProfileError;
      }
    }

    return jsonResponse({
      success: true,
      email,
      temporaryPassword,
      authUserCreated: !existingAuthUser,
    });
  } catch (error) {
    console.error('create-admin-user error', error);

    return jsonResponse({ error: readableErrorMessage(error) }, 500);
  }
});
