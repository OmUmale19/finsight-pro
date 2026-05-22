export enum UploadSource {
  CSV = "CSV",
  GOOGLE_SHEET = "GOOGLE_SHEET",
  API = "API"
}

export enum TransactionType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT"
}

export enum PipelineStatus {
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED"
}

export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL"
}
