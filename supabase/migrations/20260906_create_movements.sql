-- Movimentações de funcionários por empresa.
-- Seguro para reexecução: IF NOT EXISTS; sem DROP TABLE; não altera salary_history.
--
-- Mapeamento frontend (Movement) → coluna SQL:
--   id                 → id
--   employeeId         → employee_id
--   employeeName       → employee_name (desnormalizado para exibição)
--   type               → type
--   occurrenceDate     → movement_date
--   competence         → competence (YYYY-MM, derivável da data; indexado)
--   value              → value (texto exibido: "2h30", "R$ 150,00", etc.)
--   amount             → amount
--   (horas decimais)   → hours (para Hora extra; derivado de value no app)
--   notes              → description
--   absenceSubtype     → absence_subtype
--   estimatedDiscount  → estimated_discount
--   formula            → formula
--   createdAt          → created_at
--
-- Consistência employee ↔ business: trigger BEFORE INSERT/UPDATE valida que
-- employees.business_id = movements.business_id para o employee_id informado.

CREATE TABLE IF NOT EXISTS public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  type text NOT NULL,
  movement_date date NOT NULL,
  competence text NOT NULL,
  value text NOT NULL,
  amount numeric(12, 2),
  hours numeric(8, 2),
  description text,
  absence_subtype text,
  estimated_discount boolean,
  formula text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT movements_type_check CHECK (
    type IN ('Hora extra', 'Falta', 'Vale', 'Adicional', 'Desconto')
  ),
  CONSTRAINT movements_competence_format CHECK (competence ~ '^\d{4}-\d{2}$'),
  CONSTRAINT movements_value_not_blank CHECK (char_length(trim(value)) > 0),
  CONSTRAINT movements_amount_nonneg CHECK (amount IS NULL OR amount >= 0),
  CONSTRAINT movements_hours_nonneg CHECK (hours IS NULL OR hours >= 0),
  CONSTRAINT movements_type_fields_check CHECK (
    (
      type = 'Hora extra'
      AND char_length(trim(value)) > 0
    )
    OR (
      type IN ('Vale', 'Adicional', 'Desconto')
      AND amount IS NOT NULL
    )
    OR (
      type = 'Falta'
      AND char_length(trim(value)) > 0
    )
  ),
  CONSTRAINT movements_absence_subtype_check CHECK (
    absence_subtype IS NULL
    OR absence_subtype IN (
      'Falta injustificada',
      'Falta justificada',
      'Atestado',
      'Atraso',
      'Saída antecipada'
    )
  )
);

COMMENT ON TABLE public.movements IS 'Movimentações gerenciais (horas extras, vales, adicionais, descontos, faltas).';
COMMENT ON COLUMN public.movements.movement_date IS 'Data da ocorrência — mapeia Movement.occurrenceDate.';
COMMENT ON COLUMN public.movements.hours IS 'Horas decimais para Hora extra (ex.: 2.5 = 2h30).';
COMMENT ON COLUMN public.movements.description IS 'Observações — mapeia Movement.notes.';

CREATE INDEX IF NOT EXISTS movements_business_id_idx
  ON public.movements (business_id);

CREATE INDEX IF NOT EXISTS movements_employee_id_idx
  ON public.movements (employee_id);

CREATE INDEX IF NOT EXISTS movements_business_movement_date_idx
  ON public.movements (business_id, movement_date DESC);

CREATE INDEX IF NOT EXISTS movements_business_competence_idx
  ON public.movements (business_id, competence);

CREATE INDEX IF NOT EXISTS movements_business_employee_competence_idx
  ON public.movements (business_id, employee_id, competence);

-- ---------------------------------------------------------------------------
-- Garante que employee_id pertence ao mesmo business_id da movimentação
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_movement_employee_business()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = NEW.employee_id
      AND e.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'employee_id does not belong to the informed business_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS movements_validate_employee_business ON public.movements;

CREATE TRIGGER movements_validate_employee_business
  BEFORE INSERT OR UPDATE OF employee_id, business_id
  ON public.movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_movement_employee_business();

-- ---------------------------------------------------------------------------
-- updated_at automático (função genérica + trigger)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS movements_set_updated_at ON public.movements;

CREATE TRIGGER movements_set_updated_at
  BEFORE UPDATE ON public.movements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS movements_select_own_business ON public.movements;
DROP POLICY IF EXISTS movements_insert_own_business ON public.movements;
DROP POLICY IF EXISTS movements_update_own_business ON public.movements;
DROP POLICY IF EXISTS movements_delete_own_business ON public.movements;

CREATE POLICY movements_select_own_business
  ON public.movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = movements.business_id
        AND b.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = movements.employee_id
        AND e.business_id = movements.business_id
    )
  );

CREATE POLICY movements_insert_own_business
  ON public.movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = movements.business_id
        AND b.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = movements.employee_id
        AND e.business_id = movements.business_id
    )
  );

CREATE POLICY movements_update_own_business
  ON public.movements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = movements.business_id
        AND b.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = movements.employee_id
        AND e.business_id = movements.business_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = movements.business_id
        AND b.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = movements.employee_id
        AND e.business_id = movements.business_id
    )
  );

CREATE POLICY movements_delete_own_business
  ON public.movements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = movements.business_id
        AND b.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = movements.employee_id
        AND e.business_id = movements.business_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.movements
TO authenticated;
