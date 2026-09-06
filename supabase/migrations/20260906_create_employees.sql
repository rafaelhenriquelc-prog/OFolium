-- Funcionários por empresa (business).
-- Seguro para reexecução parcial: usa IF NOT EXISTS; não remove dados nem altera colunas existentes.
-- Se public.employees já existir com schema diferente, revise manualmente antes de aplicar.

-- ---------------------------------------------------------------------------
-- Tabela
-- Mapeamento frontend (Employee) → coluna SQL:
--   id            → id (UUID)
--   name          → name
--   role          → role
--   status        → status ('Ativo' | 'Ativa' | 'Inativo' | 'Inativa')
--   baseSalary    → base_salary (numeric)
--   hireDate      → hire_date (date)
--   inactiveDate  → inactive_date (date, nullable)
--   phone         → phone
--   email         → email
--   initials      → calculado no app a partir de name
--   avatarColor   → calculado no app (não persistido nesta etapa)
--   salaryHistory → não persistido nesta etapa
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL,
  base_salary numeric(12, 2) NOT NULL,
  hire_date date NOT NULL,
  inactive_date date,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_name_not_blank CHECK (char_length(trim(name)) > 0),
  CONSTRAINT employees_role_not_blank CHECK (char_length(trim(role)) > 0),
  CONSTRAINT employees_status_check CHECK (
    status IN ('Ativo', 'Ativa', 'Inativo', 'Inativa')
  ),
  CONSTRAINT employees_base_salary_nonneg CHECK (base_salary >= 0),
  CONSTRAINT employees_inactive_date_consistency CHECK (
    inactive_date IS NULL OR status IN ('Inativo', 'Inativa')
  )
);

COMMENT ON TABLE public.employees IS 'Funcionários vinculados a uma empresa (business).';
COMMENT ON COLUMN public.employees.business_id IS 'Empresa proprietária; isolamento via RLS por owner_id em businesses.';
COMMENT ON COLUMN public.employees.role IS 'Cargo/função — mapeia Employee.role no frontend.';
COMMENT ON COLUMN public.employees.base_salary IS 'Salário base mensal; numeric evita imprecisão de float.';

CREATE INDEX IF NOT EXISTS employees_business_id_idx
  ON public.employees (business_id);

CREATE INDEX IF NOT EXISTS employees_business_id_name_idx
  ON public.employees (business_id, name);

CREATE INDEX IF NOT EXISTS employees_business_id_status_idx
  ON public.employees (business_id, status);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employees_set_updated_at ON public.employees;

CREATE TRIGGER employees_set_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — acesso apenas à empresa do usuário autenticado
-- ---------------------------------------------------------------------------

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employees_select_own_business ON public.employees;
DROP POLICY IF EXISTS employees_insert_own_business ON public.employees;
DROP POLICY IF EXISTS employees_update_own_business ON public.employees;
DROP POLICY IF EXISTS employees_delete_own_business ON public.employees;

CREATE POLICY employees_select_own_business
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employees.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY employees_insert_own_business
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employees.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY employees_update_own_business
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employees.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employees.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY employees_delete_own_business
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employees.business_id
        AND b.owner_id = auth.uid()
    )
  );
