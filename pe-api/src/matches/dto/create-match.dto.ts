import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateMatchDto {
  @IsUUID('4', { message: 'El ID de la serie debe ser un UUID válido' })
  @IsNotEmpty()
  series_id!: string;

  @IsInt()
  @Min(1, { message: 'El orden del mapa debe ser al menos 1' })
  match_order!: number;
}
