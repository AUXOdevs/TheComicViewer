import { Controller } from '@nestjs/common';
import { SuperadminService } from './super-admin.service';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperadminService) {}
}
