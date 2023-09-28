import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { companiesProviders } from './companies.providers'; // Import the providers

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, ...companiesProviders],
})
export class CompaniesModule {}
