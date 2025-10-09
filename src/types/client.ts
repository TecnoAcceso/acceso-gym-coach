export interface MedicalCondition {
  has_pathology: boolean
  pathology_detail?: string
  has_injury: boolean
  injury_detail?: string
  has_allergies: boolean
  allergies_detail?: string
}

export interface Client {
  id: string
  cedula: string
  document_type: 'V' | 'E'
  full_name: string
  phone: string
  birth_date?: string
  initial_weight?: number
  height?: number
  medical_condition?: MedicalCondition
  start_date: string
  duration_months: number
  end_date: string
  status: 'active' | 'expiring' | 'expired'
  created_at: string
  updated_at: string
  trainer_id: string
}

export interface CreateClientData {
  cedula: string
  document_type: 'V' | 'E'
  full_name: string
  phone: string
  birth_date?: string
  initial_weight?: number
  height?: number
  medical_condition?: MedicalCondition
  start_date: string
  duration_months: number
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string
}

export interface MeasurementRecord {
  id: string
  client_id: string
  date: string
  objetivo?: string
  peso?: number
  hombros?: number
  pecho?: number
  espalda?: number
  biceps_der?: number
  biceps_izq?: number
  cintura?: number
  gluteo?: number
  pierna_der?: number
  pierna_izq?: number
  pantorrilla_der?: number
  pantorrilla_izq?: number
  notas?: string
  created_at: string
  updated_at: string
}

export interface CreateMeasurementData {
  client_id: string
  date: string
  objetivo?: string
  peso?: number
  hombros?: number
  pecho?: number
  espalda?: number
  biceps_der?: number
  biceps_izq?: number
  cintura?: number
  gluteo?: number
  pierna_der?: number
  pierna_izq?: number
  pantorrilla_der?: number
  pantorrilla_izq?: number
  notas?: string
}