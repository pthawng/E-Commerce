/**
 * ValidateCheckoutDto
 *
 * Empty DTO to satisfy ValidationPipe when frontend sends an empty object {}.
 * Using this prevents 400 Bad Request when forbidNonWhitelisted is true.
 */
export class ValidateCheckoutDto {
  // No fields required for Step 1 validation
}
