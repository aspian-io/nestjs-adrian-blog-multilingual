import { Lang } from "src/langs/entities/lang.entity";

/**
 * Utilities to help with manipulating objects
 */
export class ObjectUtils {
  /**
   * Manipulate and adjust entity meta result object by given language info
   * 
   * @param result - Resulted entity
   * @param defaultLocaleName - Default language locale name
   * @param currentLangLocaleName - Current language locale name
   * @returns - Manipulated and adjusted entity result
   */
  static adjustEntityMetaResultByLang<T extends IAdjustEntityByLang> ( result: T, defaultLocaleName: string, currentLangLocaleName?: string ): T;

  /**
   * Manipulate and adjust entities meta result object by given language info
   * 
   * @param result - Resulted entities
   * @param defaultLocaleName - Default language locale name
   * @param currentLangLocaleName - Current language locale name
   * @returns - Manipulated and adjusted entities result
   */
  static adjustEntityMetaResultByLang<T extends IAdjustEntityByLang> ( result: T[], defaultLocaleName: string, currentLangLocaleName?: string ): T[];

  // `adjustEntityMetaResultByLang` overloading implementation
  static adjustEntityMetaResultByLang<T extends IAdjustEntityByLang> ( result: T | T[], defaultLocaleName: string, currentLangLocaleName?: string ): T | T[] {
    if ( !Array.isArray( result ) ) {
      return this.adjustSingleEntityMetaResult( result, defaultLocaleName, currentLangLocaleName );
    }

    return result.map( e => this.adjustSingleEntityMetaResult( e, defaultLocaleName, currentLangLocaleName ) );
  }

  /********************************************************/
  /**************** Helper Methods Region *****************/
  /********************************************************/

  private static adjustSingleEntityMetaResult<T extends IAdjustEntityByLang> ( result: T, defaultLocaleName: string, currentLangLocaleName?: string ): T {
    if ( result?.meta?.length ) {
      if ( currentLangLocaleName ) {
        const currentLangMetaResult = result.meta.filter( m => m.lang.localeName === currentLangLocaleName );
        if ( currentLangMetaResult.length ) {
          result.meta = currentLangMetaResult;
          return result;
        }
        result.meta = result.meta.filter( m => m.lang.localeName === defaultLocaleName );
        return result;
      }

      result.meta = result.meta.filter( m => m.lang.localeName === defaultLocaleName );
      return result;
    }
  }
}

/********************************************************/
/******************** Types Region **********************/
/********************************************************/

// Adjust entity by lang type
export interface IAdjustEntityByLang {
  meta: {
    lang: Partial<Lang>;
  }[];
}