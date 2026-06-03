import { IsIn, IsOptional, IsString } from 'class-validator';

export class ResolveDiscrepancyDto {
  @IsIn(['DEDUCT_LOSS', 'ADD_SURPLUS', 'RE_SCANNED'])
  action: 'DEDUCT_LOSS' | 'ADD_SURPLUS' | 'RE_SCANNED';

  @IsIn(['LOST', 'MISSING', 'FOUND', 'WRITTEN_OFF', 'AVAILABLE'])
  targetStatus: 'LOST' | 'MISSING' | 'FOUND' | 'WRITTEN_OFF' | 'AVAILABLE';

  @IsOptional()
  @IsString()
  note?: string;
}
