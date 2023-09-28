import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { branchesProviders } from './branches.providers'; // Import the providers

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, ...branchesProviders],
})
export class BranchesModule {}
