export interface StoredSecrets {
  pagespeedApiKey: string
  aiApiKey: string
}

export interface SecretsStatus {
  secrets: StoredSecrets
  persistent: boolean
}
