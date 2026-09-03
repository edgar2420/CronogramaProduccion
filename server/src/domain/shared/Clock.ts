/**
 * Puerto de tiempo. Todo timestamp persistido (auditoría, validFrom/validTo,
 * bloqueo de cuentas) debe originarse aquí, nunca de un valor enviado por el
 * cliente, para cumplir "timestamps generados por el servidor".
 */
export interface Clock {
  now(): Date;
}
