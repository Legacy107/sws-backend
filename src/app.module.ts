import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomCacheModule } from './cache/custom-cache.module';
import { getEnvPath } from './common/helper/env.helper';
import { SettingModule } from './common/shared/setting/setting.module';
import { SettingService } from './common/shared/setting/setting.service';
import { CompanyModule } from './company/company.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: getEnvPath(`${__dirname}/..`) }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [SettingModule],
      inject: [SettingService],
      useFactory: (settingService: SettingService) =>
        settingService.graphqlUseFactory,
    }),
    TypeOrmModule.forRootAsync({
      imports: [SettingModule],
      inject: [SettingService],
      useFactory: (settingService: SettingService) =>
        settingService.typeOrmUseFactory,
    }),
    CompanyModule,
    HealthModule,
    CustomCacheModule.forRoot(),
  ],
})
export class AppModule {}
