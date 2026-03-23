alter table cpf_account_settings
  add column if not exists frs_met_for_ma_overflow boolean not null default false;
