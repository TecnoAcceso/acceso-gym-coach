export interface Client {
  id: string
  cedula: string
  document_type: 'V' | 'E'
  full_name: string
  phone: string
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
  start_date: string
  duration_months: number
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string
}