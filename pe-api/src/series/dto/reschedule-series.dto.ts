// pe-api/src/series/dto/reschedule-series.dto.ts
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleSeriesDto {
  @IsDateString()
  @IsNotEmpty()
  scheduled_date!: string;
}
