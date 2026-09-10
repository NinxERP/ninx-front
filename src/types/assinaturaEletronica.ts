export interface ConfirmarAssinaturaEletronicaRequest {
  imagemBase64: string;
  latitude?: number;
  longitude?: number;
}

export interface AssinaturaEletronicaResponse {
  documentoGuid: string;
  filename: string;
  documentoBase64: string;
  documentoAssinadoBase64?: string;
  assinaturaBase64?: string;
  assinado: boolean;
}
