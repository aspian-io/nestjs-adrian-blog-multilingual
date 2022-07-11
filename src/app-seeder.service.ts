import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Lang } from "./langs/entities/lang.entity";
import { Setting } from "./settings/entities/setting.entity";
import { User } from "./users/entities/user.entity";
import { languageData } from "./common/seeding-data/languages.data";
import * as chalk from 'chalk';
import { ConfigService } from "@nestjs/config";
import { settingsData } from "./common/seeding-data/settings.data";
import { SettingsKeyEnum } from './settings/entities/setting.entity';
import { UserMeta } from "./users/entities/user-meta.entity";
import { userData } from "./common/seeding-data/users.data";
import { Claim } from "./users/entities/claim.entity";
import { claimData } from "./common/seeding-data/user-claims.data";
import { PermissionsEnum } from "./common/security/permissions.enum";

@Injectable()
export class AppSeederService {
  constructor (
    @InjectRepository( Lang ) private langRepository: Repository<Lang>,
    @InjectRepository( Setting ) private settingsRepository: Repository<Setting>,
    @InjectRepository( User ) private userRepository: Repository<User>,
    @InjectRepository( UserMeta ) private userMetaRepository: Repository<UserMeta>,
    @InjectRepository( Claim ) private claimRepository: Repository<Claim>,
    private configService: ConfigService
  ) { }

  async insertMany () {
    try {
      // Langs
      await this.langRepository.insert( languageData );
      const defaultLang = await this.langRepository.findOneBy( { localeName: this.configService.get( 'DEFAULT_LANG' ) } );
      // Settings
      await this.settingsRepository.insert( settingsData( this.configService ) );

      if ( defaultLang.id ) {
        await this.settingsRepository.update( { key: SettingsKeyEnum.TRANSLATION_DEFAULT_LANG }, { value: defaultLang.id } );
        await this.settingsRepository.update( { key: SettingsKeyEnum.TRANSLATION_MULTILINGUAL }, { value: "true" } );
      }
      // Claims
      await this.claimRepository.insert( claimData );
      const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
      // Users
      const usersList = await userData();
      usersList[ 0 ].claims.push( adminClaim );
      usersList[ 1 ].claims.push( adminClaim );
      await Promise.all( usersList.map( async ( user ) => {
        const createdUser = this.userRepository.create( user );
        const userMetaData = {
          firstName: "test_firstname",
          lastName: "test_lastname",
          lang: defaultLang
        };
        const userMetaCreated = this.userMetaRepository.create( userMetaData );
        createdUser.meta = [ userMetaCreated ];
        await this.userRepository.save( createdUser );
      } ) );

      console.log( chalk.bold.green( "Data imported successfully!" ) );
      process.exit();
    } catch ( error ) {
      console.log( chalk.red.inverse( "Something went wrong importing data into the database, ", error ) );
      process.exit( 1 );
    }
  }

  async deleteMany () {
    try {
      // Claims
      await this.claimRepository.delete( {} );
      // UserMeta
      await this.userMetaRepository.delete( {} );
      // User
      await this.userRepository.delete( {} );
      // Langs
      await this.langRepository.delete( {} );
      // Settings
      await this.settingsRepository.delete( {} );

      console.log( chalk.bold.red( "Data destroyed successfully!" ) );
      process.exit();
    } catch ( error ) {
      console.log( chalk.red.inverse( "Something went wrong clearing the database, " ), error );
      process.exit( 1 );
    }
  }
}